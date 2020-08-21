import * as React from "react";
import * as joint from "jointjs";
import Portal from "./Portal";
import omit = require("lodash/omit");
import { Option, none, some, fold, isNone } from "fp-ts/lib/Option";
import { identity } from "fp-ts/lib/function";

export type Port = joint.dia.Element.Port & {
  element: JSX.Element;
  id: string;
  size: { width: number; height: number };
  magnet: "active" | "passive" | "none";
};

export type Node = joint.dia.Element.Attributes & {
  element: JSX.Element;
  type: string;
  id: string;
  size: { width: number; height: number };
  position: { x: number; y: number };
  ports: Array<Port>;
};

export type Props = {
  graph: joint.dia.Graph;
  paperOptions: joint.dia.Paper.Options;
  nodes: Array<Node>;
  links: Array<joint.dia.Link>;
  paperRef?: (paper: joint.dia.Paper) => void;
  version?: string;
};

type State = {
  initialized: boolean;
};

export default class ReactJointJS extends React.Component<Props, State> {
  paper: Option<joint.dia.Paper> = none;
  paperElement: React.RefObject<HTMLDivElement> = React.createRef();

  state: State = {
    initialized: false
  };

  // use JSON markup instead of string to remove XML parsing step and improve performance
  foreignObjectMarkup = (
    attributes: {
      width: number;
      height: number;
      id: string;
    } & { [k: string]: any }
  ): joint.dia.MarkupJSON => [
    {
      tagName: "foreignObject",
      attributes: {
        ...attributes
      }
    }
  ];

  initializeGraph = () => {
    const paper = fold<joint.dia.Paper, joint.dia.Paper>(
      () =>
        new joint.dia.Paper({
          // bad typings
          ...({
            el: this.paperElement.current,
            model: this.props.graph
          } as joint.dia.Paper.Options),
          ...this.props.paperOptions
        }),
      identity
    )(this.paper);

    paper.freeze();

    const cells: joint.dia.Cell[] = [];

    this.props.nodes.forEach(node => {
      const nodeElement = new joint.shapes.basic.Generic({
        ...omit(node, ["element", "ports"]), // JointJS deeply clones everything... remove unnecessary properties to improve performance
        markup: this.foreignObjectMarkup({
          width: node.size.width,
          height: node.size.height,
          id: `node_${node.id}`
        })
      });

      node.ports.forEach(port =>
        nodeElement.addPort({
          ...omit(port, ["element", "size", "magnet"]), // JointJS deeply clones everything... remove unnecessary properties to improve performance
          markup: this.foreignObjectMarkup({
            width: port.size.width,
            height: port.size.height,
            id: `port_${port.id}`,
            magnet: port.magnet === "none" ? undefined : port.magnet
          })
        })
      );

      cells.push(nodeElement);
    });

    this.props.links.forEach(link => {
      cells.push(link);
    });

    // much better perf than adding each cell with "graph.addCell"
    this.props.graph.resetCells(cells);

    if (isNone(this.paper)) {
      this.paper = some(paper);
      this.props.paperRef && this.props.paperRef(paper);

      // handles async render
      (paper as any).on("render:done", () => {
        if (!this.state.initialized) {
          this.setState({ initialized: true });
        }
      });
    }

    // batch render all cells
    paper.unfreeze();
  };

  componentDidMount() {
    this.initializeGraph();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.version !== this.props.version) {
      this.props.graph.clear();
      this.setState({ initialized: false }, this.initializeGraph);
    }
  }

  renderNodes = (): JSX.Element[] =>
    this.props.nodes.map(node => {
      return (
        <React.Fragment key={node.id}>
          <Portal
            id={`node_${node.id}`}
            key={`node_${node.id}`}
            element={node.element}
          />
          {node.ports.map(port => {
            return (
              <Portal
                id={`port_${port.id}`}
                key={`port_${port.id}`}
                element={port.element}
              />
            );
          })}
        </React.Fragment>
      );
    });

  render() {
    return (
      <React.Fragment>
        <div className="react-joint-js-paper" ref={this.paperElement} />
        {this.state.initialized && this.renderNodes()}
      </React.Fragment>
    );
  }
}
