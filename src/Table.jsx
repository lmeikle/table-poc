import React from 'react';
import * as Reactabular from 'reactabular-table';
import * as resizable from 'reactabular-resizable';
import resizableHelper from './helpers/resizableHelper'
import uuid from 'uuid';
import generateRows from './helpers/generateRows';
import * as resolve from 'table-resolver';
import './styles.css';
import {throttle} from 'lodash';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import * as dnd from 'reactabular-dnd';

const Balancer = {
    balance(distribution, goal, places){

        // Reduce the distribution to the sum of its values
        const sum = distribution.reduce((sum, value) => sum + value, 0);

        // For each value in the distribution, get its percentage.
        const percentages = distribution.map(value => value / sum);

        // For each percentage, multiply the goal to get an equally distributed value.
        const goalDistribution = percentages.map(percentage => goal * percentage);

        // For each value, round them off.
        return goalDistribution.map(value => Balancer.round(value, places));
    },
    round(number, precision) {
        const factor = Math.pow(10, precision);
        return Math.round(number * factor) / factor;
    }
}

const schema = {
    type: 'object',
    properties: {
        id: {
            type: 'string'
        },
        name: {
            type: 'string'
        },
        address: {
            type: 'string'
        },
        company: {
            type: 'string'
        },
        age: {
            type: 'integer'
        }
    },
    required: ['id', 'name', 'age', 'company']
};
const rows = generateRows(100, schema);

/**
 * handle some fixed width cols
 * make draggable configurable
 * 1 scroll bar to scroll the header and body
 * test with paging
 */
class Table extends React.Component {
    constructor(props) {
        super(props);

        this.resizableHelper = resizableHelper({
            globalId: uuid.v4(),
            getId: ({ property}) => property
        });

        this.updateDimensions = this.updateDimensions.bind(this);
        this.onMoveColumn = this.onMoveColumn.bind(this);

        let columns = this.getColumns();
        let totalColumnsWidth = 0;
        for(let i = 0; i < columns.length; i++) {
            totalColumnsWidth += columns[i].width;
        }

        this.state = {
            columns: this.resizableHelper.initialize(columns),
            rows,
            width:  totalColumnsWidth
        };
    }

    updateDimensions() {
            let update_width  = window.innerWidth - 50;
            let columns = this.state.columns;

            let totalColumnsWidth = 0;
            for(let i = 0; i < columns.length; i++) {
                totalColumnsWidth += columns[i].width;
            }

            let w = update_width - (columns.length * 1) - 2;
            if (!this.colWidths) {
                this.colWidths = [];
                let diff = update_width - this.state.width;
                let inc = diff / columns.length;
                for (let i = 0; i < columns.length; i++) {
                    this.colWidths.push(columns[i].width + inc);
                }
            }

            // https://codereview.stackexchange.com/questions/151529/balance-array-of-numbers-to-maintain-distribution-but-sum-up-to-a-goal
            this.colWidths = Balancer.balance(this.colWidths, w, 0);
            // check they add up to update_width

            for (let i = 0; i < columns.length; i++) {
                this.resizableHelper.update({ column: columns[i], width: this.colWidths[i] });
            }

            this.setState({ width: update_width});
    }

    componentDidMount() {
        this.updateDimensions();
        window.addEventListener("resize", this.updateDimensions);
    }

    componentWillUnmount() {
        this.resizableHelper.cleanup();
        window.removeEventListener("resize", this.updateDimensions);
    }

    getColumns() {
        const resizableFormatter = resizable.column({
            onDragStart: (width, { column }) => {
                console.log('drag start', width, column);
            },
            onDrag: (width, { column }) => {
                this.resizableHelper.update({
                    column,
                    width
                });

                let c = this.state.columns.find(c => c.property === column.property);
                let i = this.state.columns.indexOf(c);
                this.colWidths[i] = width;
                console.log(this.colWidths)
            },
            onDragEnd: (width, { column }) => {
                console.log('drag end', width, column);
            }
        });

        return [
            {
                property: 'name',
                header: {
                    label: 'Name',
                    draggable: true, // TODO
                    formatters: [
                        resizableFormatter
                    ],
                    props: {
                        label: 'Name',
                        onMove: o => {
                            this.onMoveColumn(o)
                        }
                    }
                },
                width: 100
            },
            {
                property: 'company',
                header: {
                    label: 'Company',
                    draggable: true,
                    formatters: [
                        resizableFormatter
                    ],
                    props: {
                        label: 'Company',
                        onMove: o => {
                            this.onMoveColumn(o)
                        }
                    }
                },
                width: 100
            },
            {
                property: 'address',
                header: {
                    label: 'Address',
                    formatters: [
                        resizableFormatter
                    ],
                },
                width: 200
            },
            {
                property: 'age',
                header: {
                    label: 'Age'
                },
                width: 50
            }
        ];
    }

    onMoveColumn(labels) {
        const movedColumns = dnd.moveLabels(this.state.columns, labels);

        if (movedColumns) {
            // Retain widths to avoid flashing while drag and dropping.
            const source = movedColumns.source;
            const target = movedColumns.target;
            const sourceWidth = source.props.style && source.props.style.width;
            const targetWidth = target.props.style && target.props.style.width;

            source.props.style = {
                ...source.props.style,
                width: targetWidth
            };
            target.props.style = {
                ...target.props.style,
                width: sourceWidth
            };

            this.setState({
                columns: movedColumns.columns
            });
        }
    }

    render() {
        let { rows, columns, width } = this.state;

        const resolvedColumns = resolve.columnChildren({ columns });
        const resolvedRows = resolve.resolve({
            columns: resolvedColumns,
            method: resolve.nested
        })(rows);

        const renderers = {
            header: {
                cell: dnd.Header
            }
        };

        return (
            <Reactabular.Provider
                className="pure-table pure-table-striped"
                columns={resolvedColumns}
                style={{ width: 'auto' }}
                renderers={renderers}
            >
                <Reactabular.Header
                    style={{
                        maxWidth: width
                    }}
                    headerRows={resolve.headerRows({ columns })}
                    ref={tableHeader => {
                        this.tableHeader = tableHeader && tableHeader.getRef();
                    }}
                />

                <Reactabular.Body
                    rows={resolvedRows}
                    rowKey="id"
                    style={{
                        maxWidth: width,
                    }}
                />
            </Reactabular.Provider>
        );
    }
}



Table = DragDropContext(HTML5Backend)(Table);
export default Table;

