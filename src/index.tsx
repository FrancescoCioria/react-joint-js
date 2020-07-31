import * as React from "react";
import * as joint from "jointjs";
import omit = require("lodash/omit");
import Portal from "./Portal";

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
  paperRef?: (paper: joint.dia.Paper) => void;
};

export default class ReactJointJS extends React.Component<Props> {
  paper: joint.dia.Paper = null as any;
  paperElement: React.RefObject<HTMLDivElement> = React.createRef();

  foreignObjectMarkup = (width: number, height: number, id: string): string =>
    `<foreignObject width="${width}px" height="${height}px" id="${id}" />`;

  componentDidMount() {
    this.paper = new joint.dia.Paper({
      // bad typings
      ...({
        el: this.paperElement.current,
        model: this.props.graph
      } as joint.dia.Paper.Options),
      ...this.props.paperOptions
    });

    this.paper.freeze();

    this.props.nodes.forEach(node => {
      const nodeElement = new joint.dia.Element({
        ...omit(node, "element"),
        markup: this.foreignObjectMarkup(
          node.size.width,
          node.size.height,
          `node_${node.id}`
        )
      });

      node.ports.forEach(port =>
        nodeElement.addPort({
          ...omit(port, ["element", "size"]),
          markup: this.foreignObjectMarkup(
            port.size.width,
            port.size.height,
            `port_${port.id}`
          )
        })
      );

      this.props.graph.addCell(nodeElement);
    });

    this.props.links.forEach(link => {
      this.props.graph.addCell(link);
      link.toBack();
    });

    this.props.paperRef && this.props.paperRef(this.paper);

    this.paper.unfreeze();

    setTimeout(() => this.forceUpdate());
  }

  render() {
    return (
      <React.Fragment>
        <div className="react-joint-js-paper" ref={this.paperElement} />
        {this.props.nodes.map(node => {
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
        })}
      </React.Fragment>
    );
  }
}
