import ForceGraph3D from "3d-force-graph";
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/addons/renderers/CSS2DRenderer.js";
import { chartData } from "./dataParse";

const OPACITY = 0.3;

const rootNodeLabel = {};

const findNode2 = (nodeId) => {
  return chartData.nodes.find((node) => node.id === nodeId);
};

chartData.links.forEach((link) => {
  const a = findNode2(link.source);
  const b = findNode2(link.target);

  !a.neighbors && (a.neighbors = []);
  !b.neighbors && (b.neighbors = []);
  a.neighbors.push(b);
  b.neighbors.push(a);

  !a.links && (a.links = []);
  !b.links && (b.links = []);
  a.links.push(link);
  b.links.push(link);
});

const highlightNodes = new Set();
const highlightLinks = new Set();
let selectNode = null;

const grayColor = (color) => {
  const oldColor = color.split(",").slice(0, 3);
  const newColor = [...oldColor, ` ${OPACITY}`].join(",");
  return newColor;
};

const Graph = ForceGraph3D({
  extraRenderers: [new CSS2DRenderer()],
})(document.getElementById("3d-graph"));
Graph.backgroundColor("#ff000000")
  .showNavInfo(true)
  .graphData(chartData)
  .nodeRelSize(8)
  .nodeResolution(15)
  .nodeOpacity(1) // 节点透明度
  .nodeLabel("name")
  .nodeColor((node) => {
    if (highlightNodes.size <= 0) {
      return node.color;
    }
    return highlightNodes.has(node) ? node.color : grayColor(node.color);
  })
  .nodeLabel((node) => {
    if (node.error) {
      const innerHTML = `
      <div class="error-box">
        <div class="error-title">
          <span>告警日志</span>
          <span>12:10</span>
        </div>
        <div class="error-content">${node.name} 某某某某某某某某某某某某某某某某某某</div>
      </div>
      <div id="3d-graph" class="graph"></div>`;
      return innerHTML;
    }
    return node.name;
  })
  .nodeThreeObject((node) => {
    if (node.root) {
      const nodeEl = document.createElement("div");
      nodeEl.textContent = `${node.groupName}项目(${node.id}主系统)`;
      nodeEl.style.backgroundImage = `linear-gradient(-87deg, ${node.color} 0%, #ffffff00)`;
      nodeEl.className = "node-label";
      rootNodeLabel[node.id] = nodeEl;
      return new CSS2DObject(nodeEl);
    }
    if (node.error) {
      node.color = "rgba(255, 0, 0, 1)";
    }
    if (node.torus) {
      return new THREE.Mesh(
        new THREE.BoxGeometry(14, 14, 14),
        new THREE.MeshLambertMaterial({
          color: "rgba(255, 255, 255, 1)",
          // transparent: true,
          // opacity: 0.75,
        })
      );
    }
  })
  .nodeThreeObjectExtend((node) => {
    if (node.root) {
      return true;
    }
    return false;
  })

  .linkOpacity(1)
  .linkWidth((link) => {
    switch (link.relation) {
      case "other":
        return 2;
      case "common":
        return 1;
      default:
        return 3;
    }
  })
  .linkColor((link) => {
    if (link.relation) {
      const color = findNode2(link.source).color;
      return color;
    } else {
      return link.color;
    }
  })
  .linkDirectionalParticles((link) => (highlightLinks.has(link) ? 4 : 0))
  .linkDirectionalParticleWidth(4)
  .onNodeClick((node) => {
    console.log("node onNodeClick1");
    // no state change
    if (!node && !highlightNodes.size) return;
    if (node && selectNode === node) {
      clearHighlight();
      return;
    }
    console.log("node onNodeClick2", node);

    highlightNodes.clear();
    highlightLinks.clear();
    if (node) {
      highlightNodes.add(node);
      node.neighbors.forEach((neighbor) => highlightNodes.add(neighbor));
      node.links.forEach((link) => highlightLinks.add(link));

      // link 透明
      Graph.linkOpacity(OPACITY);

      // labelOpacity(node.id);
      for (let el of Object.values(rootNodeLabel)) {
        el.className = "node-label label-opacity";
      }
      if (rootNodeLabel[node.id]) {
        rootNodeLabel[node.id].className = "node-label";
      }
    }

    selectNode = node || null;

    updateHighlight();
  })
  .onBackgroundClick(() => {
    console.log("onBackgroundClick");
    clearHighlight();
  });
// .onLinkHover((link) => {
//   highlightNodes.clear();
//   highlightLinks.clear();

//   if (link) {
//     highlightLinks.add(link);
//     highlightNodes.add(link.source);
//     highlightNodes.add(link.target);
//   }

//   updateHighlight();
// });

function clearHighlight() {
  highlightNodes.clear();
  highlightLinks.clear();
  selectNode = null;
  updateHighlight();
  Graph.linkOpacity(1);
  for (let el of Object.values(rootNodeLabel)) {
    el.className = "node-label";
  }
}

function updateHighlight() {
  // trigger update of highlighted objects in scene
  Graph.nodeColor(Graph.nodeColor())
    .linkWidth(Graph.linkWidth())
    .linkDirectionalParticles(Graph.linkDirectionalParticles());
}
