import React from 'react';

export default function RegistryWorkflowShell({ theme = 'light', children }) {
  return (
    <div className="registry-workflow-shell" data-theme={theme}>
      <div className="workflow-inner">{children}</div>
    </div>
  );
}
