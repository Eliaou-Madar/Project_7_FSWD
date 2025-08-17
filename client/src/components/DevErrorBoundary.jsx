// client/src/components/DevErrorBoundary.jsx
import React from "react";
export default class DevErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state={err:null}; }
  static getDerivedStateFromError(error){ return {err:error}; }
  componentDidCatch(error, info){ console.error("UI error:", error, info); }
  render(){
    if (this.state.err) return <pre style={{whiteSpace:"pre-wrap"}}>{String(this.state.err)}</pre>;
    return this.props.children;
  }
}
