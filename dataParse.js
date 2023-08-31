import res from "./data.json";

const fetchData = () => {
  const { DATA } = res;
  console.log("data.instance_data", DATA.instance_data);
  console.log("data.peers_data", DATA.peers_data);

  const nodes = DATA.instance_data.map((d) => ({ id: d.ip, name: d.ip, ...d }));

  const links = DATA.peers_data.map((l) => ({
    source: l.ip_0,
    target: l.ip_1,
    ...l,
  }));

  return { nodes, links };
};

const { nodes, links } = fetchData();

const colorArray = [
  "rgba(255, 173, 30, 1)",
  "rgba(255, 231, 28, 1)",
  "rgba(255, 200, 50, 1)",
  "rgba(206, 255, 38, 1)",
  "rgba(100, 235, 18, 1)",
  "rgba(91, 191, 96, 1)",
  "rgba(46, 243, 180, 1)",
  "rgba(52, 201, 126, 1)",
  "rgba(50, 255, 142, 1)",
  "rgba(73, 255, 240, 1)",
  "rgba(126, 223, 255, 1)",
  "rgba(47, 218, 255, 1)",
  "rgba(84, 148, 255, 1)",
  "rgba(131, 144, 245, 1)",
  "rgba(54, 78, 255, 1)",
  "rgba(137, 79, 255, 1)",
  "rgba(200, 53, 255, 1)",
  "rgba(255, 104, 218, 1)",
  "rgba(255, 29, 178, 1)",
  "rgba(255, 161, 119, 1)",
];

const getGroups = () => {
  // const { nodes, links } = graphData;
  const mockGroups = [];
  for (let i = 0; i < Math.ceil(nodes.length / 8); i++) {
    const children = nodes.slice(i * 8, (i + 1) * 8).map((n) => n.id);
    const name = "ABCDEFGHIJKLMNOPQ"[i];
    mockGroups.push({ name, children, color: colorArray[i] });
  }
  return mockGroups;
};

const groups = getGroups();

// console.log("groups", groups);
groups.forEach((g) => {
  let rootFlag = true;
  g.children = g.children.map((id) => {
    const node = nodes.find((node) => node.id === id);
    if (node) {
      if (rootFlag) {
        node.val = 8;
        node.root = true;
        rootFlag = false;
      }
      node.groupName = g.name;
      node.color = g.color;
    }
  });
});

console.log(nodes);

// groups.forEach((g) => {
//   const children = g.children;

// });
export const chartData = { nodes, links };
