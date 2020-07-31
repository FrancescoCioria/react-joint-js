# React JointJS

React wrapper for [JointJS](https://github.com/clientIO/joint): refer to their documentation to learn how to customize JointJS.

React JointJS aims at simplifying the integration with React by letting you render nodes and ports with React components.

## Install

```
yarn add react-joint-js
```

## Usage

**API**:

```ts
type Port = joint.dia.Element.Port & {
  element: JSX.Element;
  id: string;
  size: { width: number; height: number };
};

type Node = joint.dia.Element.Attributes & {
  element: JSX.Element;
  type: string;
  id: string;
  size: { width: number; height: number };
  position: { x: number; y: number };
  ports: Array<Port>;
};

type Props = {
  graph: joint.dia.Graph;
  paperOptions: joint.dia.Paper.Options;
  nodes: Array<Node>;
  links: Array<joint.dia.Link>;
  paperRef: (paper: joint.dia.Paper) => void;
};
```

```tsx
<ReactJointJS
  nodes={nodes.map(node => ({
    id: node.id,
    position: {
      x: node.x,
      y: node.y
    },
    size: {
      width: 100,
      height: 130
    },
    element: <GraphNode id={node.id} />,
    type: "MyNode",
    ports: [
      {
        id: `${node.id}_1`,
        element: <Port1 label="Out 1" />,
        args: {
          x: 20,
          y: 70
        },
        size: {
          width: 76,
          height: 20
        }
      },
      {
        id: `${node.id}_2`,
        element: <Port2 label="Out 2" />,
        args: {
          x: 20,
          y: 100
        },
        size: {
          width: 76
          height: 20
        }
      },
      {
        id: `${node.id}_3`,
        element: <div />, // invisible port
        args: {
          x: 8,
          y: 80
        },
        size: {
          width: 0,
          height: 0
        }
      }
    ]
  }))}
  links={links.map(
    link =>
      new joint.shapes.standard.Link({
        source: {
          id: link.source,
          port: `${link.source}_${Math.floor(Math.random() * 2) + 1}` // random port between 1 and 2
        },
        target: { id: link.target, port: `${link.target}_3` },

        router: {
          name: "manhattan",
          args: {
            padding: 10
          }
        },
        connector: { name: "rounded" },
        attrs: {
          line: {
            stroke: "#333333",
            strokeWidth: 2
          }
        }
      })
  )}
  paperOptions={{
    width: graphSize.width + 200,
    height: graphSize.height + 200,
    gridSize: 10,
    async: true
  }}
  graph={graph}
  paperRef={paper => {
    this.paper = paper; // save ref to "paper"
  }}
/>
```

## Under the hood
React JointJS uses `foreignObject` and [portals](https://reactjs.org/docs/portals.html) to render your React components inside the `svg` created and managed by JointJS.
