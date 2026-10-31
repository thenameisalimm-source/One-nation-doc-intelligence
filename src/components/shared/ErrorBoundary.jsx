import { Component } from "react";

// Catches runtime errors in a page so the rest of the app keeps working.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Page crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="empty-block">
          <h2>This page hit an error</h2>
          <p className="muted">
            {this.state.error.message || "Unknown error"}. Try another page, or reload.
          </p>
          <button className="btn-link" onClick={() => window.location.reload()}>
            Reload app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
