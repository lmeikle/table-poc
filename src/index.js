import React from 'react';
import ReactDOM from 'react-dom';
import Table from './Table';
import DragAndDrop from "./test";

const title = 'My Minimal React Webpack Babel Setup';

ReactDOM.render(
  <div>
      <div>{title}</div>
      <Table/>
  </div>,
  document.getElementById('app')
);

module.hot.accept();