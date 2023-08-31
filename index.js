import ForceGraph3D from '3d-force-graph';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import * as THREE from 'three';
import res from './data.json';

const colorArray = (function () {
  return [...new Array(4)]
    .map(() => [
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
    ])
    .flat();
})();

const random = () => {
  return Math.floor(Math.random() * 20);
};
const renderGroup = () => {
  return [...new Array(80)].map((_, index) => {
    return {
      root: true,
      ip: index,
      color: colorArray[index],
      group: index,
      groupName: `业务系统${index + 1}`,
    };
  });
};
function formatArr(list) {
  const map = new Map();
  list.forEach((item) => {
    if (!map.has(item.ip)) {
      map.set(item.ip, item);
    }
  });
  return [...map.values()];
}
const groups = renderGroup();
let currentNode = null;
const highlightNodes = new Set();
const highlightLinks = new Set();
const targetsLinks = new Set();
const { DATA } = res;
const links = [];
DATA.nodes = formatArr(DATA.instance_data)
  .map((node) => {
    const group = groups[random()];
    const link = {
      ...group,
      ip_0: node.ip,
      ip_1: group.group,
      root: false,
    };
    links.push(link);
    return {
      ...group,
      ...node,
      root: false,
    };
  })
  .concat(groups);
DATA.links = [...links].map((link) => {
  const a = DATA.nodes.find((x) => x.ip === link.ip_0);
  const b = DATA.nodes.find((x) => x.ip === link.ip_1);
  !a.neighbors && (a.neighbors = []);
  !b.neighbors && (b.neighbors = []);
  a.neighbors.push(b);
  b.neighbors.push(a);
  !a.links && (a.links = []);
  !b.links && (b.links = []);
  a.links.push(link);
  b.links.push(link);
  return link;
});
const grayColor = (color) => {
  return color.replace(/^rgba\(((,?\s*\d+){3}).+$/, 'rgba($1, .2)');
};

const elem = document.getElementById('3d-graph');
const rootNodeLabel = {};
const Graph = ForceGraph3D({
  extraRenderers: [new CSS2DRenderer()],
})(elem);
function initGraph(data = DATA) {
  Graph.backgroundColor('#ff000000');
}
function setGraphData(data = DATA) {
  Graph.graphData(data).zoomToFit(400).cameraPosition({ x: 0, y: 0, z: 2000 });
}
function initNode() {
  Graph.nodeResolution(15)
    .nodeId('ip')
    .nodeOpacity(1)
    .nodeLabel((node) => (node.root ? '' : node.ip))
    .nodeColor((node) => {
      if (!highlightNodes.size) {
        return node.color;
      }
      return highlightNodes.has(node) ? node.color : grayColor(node.color);
    })
    .nodeVal((node) => {
      return node.root ? 4 : 2;
    })
    .nodeThreeObject((node) => {
      if (node.root) {
        const nodeEl = document.createElement('div');
        nodeEl.textContent = node.groupName;
        nodeEl.style.backgroundImage = `linear-gradient(-87deg, ${node.color} 0%, #ffffff00)`;
        nodeEl.className = 'node-label';
        rootNodeLabel[node.ip] = nodeEl;
        return new CSS2DObject(nodeEl);
      }
    })
    .nodeThreeObjectExtend(true);
}
function initLink() {
  Graph.linkSource('ip_0')
    .linkTarget('ip_1')
    .linkOpacity(1)
    .linkWidth(1)
    .linkResolution(10)
    .linkDirectionalParticles((link) => (highlightLinks.has(link) ? 4 : 0))
    .linkDirectionalParticleWidth(4);
}
function initEvent() {
  Graph.onNodeClick((node) => {
    // node.neighbors里面的ip
    // 从DATA.peers_data中找出ip_1是ips里面的
    if (!node && !highlightNodes.size) return;
    if (node && currentNode === node) {
      clearHighlight();
      return;
    }
    highlightNodes.clear();
    highlightLinks.clear();
    targetsLinks.clear();
    if (node) {
      const ips = node.neighbors.map((x) => x.ip);
      DATA.peers_data
        .filter((x) => ips.includes(x.ip_1))
        .forEach((item) => {
          item.color = node.color;
          targetsLinks.add(item);
        });
      highlightNodes.add(node);
      node.neighbors.forEach((neighbor) => highlightNodes.add(neighbor));
      node.links.forEach((link) => highlightLinks.add(link));

      Graph.linkOpacity(0.3);
      for (let el of Object.values(rootNodeLabel)) {
        el.className = `node-label label-opacity`;
      }
      if (rootNodeLabel[node.ip]) {
        rootNodeLabel[node.ip].className = 'node-label';
      }
    }
    currentNode = node || null;
    updateHighlight();
    const distance = 260;
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
    const newPos =
      node.x || node.y || node.z
        ? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
        : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)
    Graph.cameraPosition(
      newPos, // new position
      node, // lookAt ({ x, y, z })
      800, // ms transition duration)
    );
  }).onBackgroundClick(() => {
    clearHighlight();
  });
}
function setLinkLength() {
  Graph.d3Force('link').distance((link) => {
    return 60;
  });
}
function updateHighlight() {
  setGraphData({
    ...DATA,
    links: [...DATA.links, ...targetsLinks],
  });
}
function clearHighlight() {
  highlightNodes.clear();
  highlightLinks.clear();
  currentNode = null;
  if(!targetsLinks.size) return;
  targetsLinks.clear();
  setGraphData();
  initNode();
  initLink();
}
initGraph();
setGraphData();
initNode();
initLink();
initEvent();
setLinkLength();
// Graph.backgroundColor('#ff000000')
//   .graphData(DATA)
//   .nodeRelSize(8)
//   .nodeResolution(15)
//   .nodeId('ip')
//   .nodeOpacity(1)
//   .nodeLabel((node) => (node.root ? '' : node.ip))
//   .nodeColor((node) => {
//     if (!highlightNodes.size) {
//       return node.color;
//     }
//     return highlightNodes.has(node) ? node.color : grayColor(node.color);
//   })
//   .nodeVal((node) => {
//     // console.log('🚀 ~ node:', node);
//     return node.root ? 4 : 2;
//   })
//   .nodeThreeObject((node) => {
//     if (node.root) {
//       const nodeEl = document.createElement('div');
//       nodeEl.textContent = node.groupName;
//       nodeEl.style.backgroundImage = `linear-gradient(-87deg, ${node.color} 0%, #ffffff00)`;
//       nodeEl.className = 'node-label';
//       rootNodeLabel[node.ip] = nodeEl;
//       return new CSS2DObject(nodeEl);
//     }
//     // const nodeEl = document.createElement('div');
//     // nodeEl.textContent = node.root ? node.groupName : node.ip;
//     // nodeEl.style.backgroundImage = `linear-gradient(-87deg, ${node.color} 0%, #ffffff00)`;
//     // nodeEl.className = node.root ? 'node-label' : 'node-label2';
//     // rootNodeLabel[node.ip] = nodeEl;
//     // return new CSS2DObject(nodeEl);
//   })
//   // .nodeThreeObjectExtend((node) => node.root || highlightNodes.has(node))
//   .nodeThreeObjectExtend(true)

//   .linkSource('ip_0')
//   .linkTarget('ip_1')
//   .linkOpacity(1)
//   .linkWidth(1)
//   .linkResolution(10)
//   //   .linkDirectionalArrowLength(8)
//   //   .linkDirectionalArrowRelPos(1)
//   //   .linkColor((link) => {
//   //     if (root.includes(link.ip_1)) {
//   //       return DATA.nodes.find((x) => x.ip === link.ip_1).color;
//   //     }
//   //     return DATA.nodes.find((x) => x.ip === link.ip_0).color;
//   //   })
//   .linkDirectionalParticles((link) => (highlightLinks.has(link) ? 4 : 0))
//   .linkDirectionalParticleWidth(4)

//   .onNodeClick((node) => {
//     // node.neighbors里面的ip
//     // 从DATA.peers_data中找出ip_1是ips里面的
//     // console.log('🚀 ~ node:', node.neighbors);
//     if (!node && !highlightNodes.size) return;
//     if (node && currentNode === node) {
//       clearHighlight();
//       return;
//     }
//     highlightNodes.clear();
//     highlightLinks.clear();
//     targetsLinks.clear();
//     if (node) {
//       const ips = node.neighbors.map((x) => x.ip);
//       DATA.peers_data
//         .filter((x) => ips.includes(x.ip_1))
//         .forEach((item) => {
//           item.color = node.color;
//           targetsLinks.add(item);
//           // return item;
//         });
//       //   console.log('🚀 ~ targets:', targets);
//       highlightNodes.add(node);
//       node.neighbors.forEach((neighbor) => highlightNodes.add(neighbor));
//       node.links.forEach((link) => highlightLinks.add(link));

//       Graph.linkOpacity(0.3);
//       for (let el of Object.values(rootNodeLabel)) {
//         el.className = `node-label label-opacity`;
//         // el.className = 'label-opacity2';
//       }
//       if (rootNodeLabel[node.ip]) {
//         rootNodeLabel[node.ip].className = 'node-label';
//       }
//     }
//     currentNode = node || null;
//     updateHighlight();
//     const distance = 260;
//     const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
//     const newPos =
//       node.x || node.y || node.z
//         ? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
//         : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)
//     Graph.cameraPosition(
//       newPos, // new position
//       node, // lookAt ({ x, y, z })
//       400, // ms transition duration)
//     );
//   })
//   .onBackgroundClick(() => {
//     clearHighlight();
//   });

// // 连接线的长度
// // Graph.d3Force('link').distance((link) => {
// //   // console.log("🚀 ~ link:", link)
// //   return 60;
// // });
// // 将节点展开得更宽一些
// // Graph.d3Force('charge').strength(-20);
// // linkForce.distance((link) => 150);

// // 自适应画布
// // Graph.onEngineStop(() => Graph.zoomToFit(400));

// // const planeGeometry = new THREE.PlaneGeometry(1000, 1000, 1, 1);
// // const planeMaterial = new THREE.MeshLambertMaterial({ color: '#fff', side: THREE.DoubleSide });
// // const mesh = new THREE.Mesh(planeGeometry, planeMaterial);
// // mesh.position.set(-100, -200, -100);
// // mesh.rotation.set(0.5 * Math.PI, 0, 0);
// // Graph.scene().add(mesh);
// // const loader = new THREE.TextureLoader();
// // const texture = loader.load(bg);
// // const scene = Graph.scene();
// // scene.background = texture;

// // const bloomPass = new UnrealBloomPass();
// // bloomPass.strength = 3;
// // bloomPass.radius = 1;
// // bloomPass.threshold = 0.1;
// // Graph.postProcessingComposer().addPass(bloomPass);
// function updateHighlight() {
//   Graph.graphData({
//     ...DATA,
//     links: [...DATA.links, ...targetsLinks],
//   });
//   //   Graph.linkOpacity(1);
//   Graph.nodeColor(Graph.nodeColor())
//     .linkWidth(Graph.linkWidth())
//     .linkDirectionalParticles(Graph.linkDirectionalParticles())
//     .nodeRelSize(8)
//     .nodeResolution(15)
//     .nodeVal((node) => {
//       return node.root ? 4 : 2;
//     });
//   //   Graph.refresh();
// }

// function clearHighlight() {
//   highlightNodes.clear();
//   highlightLinks.clear();
//   currentNode = null;
//   if (targetsLinks.size) {
//     Graph.graphData(DATA);
//     targetsLinks.clear();
//   }
//   Graph.linkOpacity(1);
//   //   updateHighlight();
//   //   for (let el of Object.values(rootNodeLabel)) {
//   //     el.className = 'node-label';
//   //   }
//   Graph.refresh();
//   // Graph.d3Force('charge').strength(-10);
//   //   myGraph.zoomToFit(400).cameraPosition({ x: 0, y: 0, z: 40 });
// }

// const initBackground = () => {
//   // 星空背景
//   const texLoader = new THREE.TextureLoader(); // 创建纹理贴图的加载器
//   let texture = texLoader.load('./star.png');

//   const positions = [];
//   const colors = [];
//   let startGeometry = new THREE.BufferGeometry();
//   for (var i = 0; i < 20000; i++) {
//     var vertex = new THREE.Vector3();
//     vertex.x = Math.random() * 2 - 1;
//     vertex.y = Math.random() * 2 - 1;
//     vertex.z = Math.random() * 2 - 1;
//     positions.push(vertex.x, vertex.y, vertex.z);
//     var color = new THREE.Color();
//     color.setHSL(Math.random() * 0.2 + 0.5, 0.55, Math.random() * 0.25 + 0.55);
//     colors.push(color.r, color.g, color.b);
//   }
//   startGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
//   startGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

//   let starsMaterial = new THREE.PointsMaterial({
//     map: texture,
//     size: 1,
//     transparent: true,
//     opacity: 1,
//     vertexColors: true, //true：且该几何体的colors属性有值，则该粒子会舍弃第一个属性--color，而应用该几何体的colors属性的颜色
//     blending: THREE.AdditiveBlending,
//     sizeAttenuation: true,
//   });

//   let stars = new THREE.Points(startGeometry, starsMaterial);
//   stars.scale.set(300, 300, 300);
//   Graph.scene().add(stars);
// };
// initBackground()
