import * as React from "react";
import * as ReactDOM from "react-dom";

type Props = {
  id: string;
  element: JSX.Element;
};

export default class Portal extends React.Component<Props> {
  render() {
    const containerNode = document.getElementById(this.props.id);

    return containerNode
      ? ReactDOM.createPortal(this.props.element, containerNode)
      : null;
  }
}
