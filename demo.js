// import ForceGraph3D from '3d-force-graph';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
// import * as THREE from 'three';
// import { CSS2DObject, CSS2DRenderer } from 'https://unpkg.com/three/examples/jsm/renderers/CSS2DRenderer.js';

const colorArray = [
  'rgba(255, 173, 30, 1)',
  'rgba(255, 231, 28, 1)',
  'rgba(255, 200, 50, 1)',
  'rgba(206, 255, 38, 1)',
  'rgba(100, 235, 18, 1)',
  'rgba(91, 191, 96, 1)',
  'rgba(46, 243, 180, 1)',
  'rgba(52, 201, 126, 1)',
  'rgba(50, 255, 142, 1)',
  'rgba(73, 255, 240, 1)',
  'rgba(126, 223, 255, 1)',
  'rgba(47, 218, 255, 1)',
  'rgba(84, 148, 255, 1)',
  'rgba(131, 144, 245, 1)',
  'rgba(54, 78, 255, 1)',
  'rgba(137, 79, 255, 1)',
  'rgba(200, 53, 255, 1)',
  'rgba(255, 104, 218, 1)',
  'rgba(255, 29, 178, 1)',
  'rgba(255, 161, 119, 1)',
];

const groups = [...Array(20).keys()].map((i) => ({
  groupName: `${i} 项目`,
  groupColor: colorArray[i],
}));

// {
//   id: "A系统",
//   name: "X",
//   groupName?: 'group',
//   color?: "rgba(160, 255, 165, 1)",
//   root?: true,
//   val?: 8,
//   error?: 'string',
//   torus: true,
// },
// { source: "A系统", target: "B系统", color?: colorX, relation?: string },

const N = 160;
const nodes = [...Array(N).keys()].map((i) => ({ id: i, name: `${i} 系统` }));

const links = [];
for (let i = 0; i < groups.length; i++) {
  for (let j = 0; j < 8; j++) {
    const nIndex = i * 8 + j;
    nodes[nIndex].groupName = groups[i].groupName;
    nodes[nIndex].color = groups[i].groupColor;

    if (j === 0) {
      nodes[nIndex].root = true;
      nodes[nIndex].val = 8;
      for (let k = nIndex + 1; k < nIndex + 8; k++)
        links.push({
          source: nodes[nIndex].id,
          target: nodes[k].id,
          color: groups[i].groupColor,
        });
    }
  }
}
// 同一子系统间连线
links.push({ source: 6, target: 7, relation: 'group' });

// 不同项目子系统间连线
const newLinks = [
  [1, 12],
  [1, 20],
  [12, 20],
];
for (let i = 0; i < 20; i++) {
  newLinks.push([curryCreateRandom(), curryCreateRandom()]);
}
newLinks.forEach((l) => {
  links.push({ source: l[0], target: l[1], relation: 'other' });
});

// 属于三个项目的系统
// nodes.push({ id: 160, name: "特殊系统", torus: true });
// links.push({ source: 0, target: 160, relation: "common" });
// links.push({ source: 16, target: 160, relation: "common" });
// links.push({ source: 24, target: 160, relation: "common" });
for (let i = N; i < N + 10; i++) {
  nodes.push({ id: i, name: '特殊系统', torus: true });
  for (let j = 0; j < 3; j++) {
    links.push({ source: curryCreateRandom(), target: i, relation: 'common' });
  }
}

// error
nodes[1].error = '我是错误';

// const mockData = {};
const mockData = {
  nodes,
  links,
};

console.log(nodes);
console.log(links);

function createRandom(minNum, maxNum) {
  return Math.floor(Math.random() * (maxNum - minNum + 1) + minNum);
}
function curryCreateRandom() {
  return createRandom(0, 159);
}

const OPACITY = 0.3;
const rootNodeLabel = {};
mockData.links.forEach((link) => {
  console.log('🚀 ~ mockData:', mockData.nodes);
  console.log('🚀 ~ link:', link);
  const a = mockData.nodes[link.source];
  const b = mockData.nodes[link.target];
  // const a = findNode2(link.source);
  // const b = findNode2(link.target);

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
  const oldColor = color.split(',').slice(0, 3);
  const newColor = [...oldColor, ` ${OPACITY}`].join(',');
  console.log('🚀 ~ oldColor:', oldColor);
  console.log('🚀 ~ newColor:', newColor);
  return newColor;
};

const Graph = ForceGraph3D({
  extraRenderers: [new CSS2DRenderer()],
})(document.getElementById('3d-graph'));
Graph.backgroundColor('#ff000000')
  .graphData(mockData)
  .showNavInfo(true)
  .nodeRelSize(8)
  .nodeResolution(15)
  .nodeOpacity(1) // 节点透明度
  .nodeLabel('name')
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
      const nodeEl = document.createElement('div');
      nodeEl.textContent = `${node.groupName}项目(${node.id}主系统)`;
      nodeEl.style.backgroundImage = `linear-gradient(-87deg, ${node.color} 0%, #ffffff00)`;
      nodeEl.className = 'node-label';
      rootNodeLabel[node.id] = nodeEl;
      return new CSS2DObject(nodeEl);
    }
    if (node.error) {
      node.color = 'rgba(255, 0, 0, 1)';
    }
    if (node.torus) {
      return new THREE.Mesh(
        new THREE.BoxGeometry(14, 14, 14),
        new THREE.MeshLambertMaterial({
          color: 'rgba(255, 255, 255, 1)',
          // transparent: true,
          // opacity: 0.75,
        }),
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
      case 'other':
        return 2;
      case 'common':
        return 1;
      default:
        return 3;
    }
  })
  .linkColor((link) => {
    if (link.relation) {
      const index = link.source instanceof Object ? link.source.id : link.source;
      const color = mockData.nodes[index].color;
      return color;
    } else {
      return link.color;
    }
  })
  .linkDirectionalParticles((link) => (highlightLinks.has(link) ? 4 : 0))
  .linkDirectionalParticleWidth(4)
  .onNodeClick((node) => {
    console.log('node onNodeClick1');
    // no state change
    if (!node && !highlightNodes.size) return;
    if (node && selectNode === node) {
      clearHighlight();
      return;
    }
    console.log('node onNodeClick2', node);

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
        el.className = 'node-label label-opacity';
      }
      if (rootNodeLabel[node.id]) {
        rootNodeLabel[node.id].className = 'node-label';
      }
    }

    selectNode = node || null;

    updateHighlight();
  })
  .onBackgroundClick(() => {
    console.log('onBackgroundClick');
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
    el.className = 'node-label';
  }
}

function updateHighlight() {
  // trigger update of highlighted objects in scene
  Graph.nodeColor(Graph.nodeColor())
    .linkWidth(Graph.linkWidth())
    .linkDirectionalParticles(Graph.linkDirectionalParticles());
}
