
import React from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import cloneDeep from 'lodash/cloneDeep';
import findIndex from 'lodash/findIndex';
import * as Table from 'reactabular-table';
import * as dnd from 'reactabular-dnd';
import * as resolve from 'table-resolver';


const rows = [
    {
        id: 1,
        name: {
            first: 'John',
            last: 'Johnson'
        },
        company: 'John Inc.',
        sentence: 'consequatur nihil minima corporis omnis nihil rem'
    },
    {
        id: 2,
        name: {
            first: 'Mike',
            last: 'Mikeson'
        },
        company: 'Mike Inc.',
        sentence: 'a sequi doloremque sed id quo voluptatem voluptatem ut voluptatibus'
    },
    {
        id: 3,
        name: {
            first: 'Jake',
            last: 'Jackson'
        },
        company: 'Jake Inc.',
        sentence: 'sed id quo voluptatem voluptatem ut voluptatibus'
    },
    {
        id: 4,
        name: {
            first: 'Don',
            last: 'Donson'
        },
        company: 'Don Inc.',
        sentence: 'voluptatem voluptatem ut voluptatibus'
    }
];

class DragAndDropTable extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            columns: [
                {
                    props: {
                        style: {
                            width: 100
                        }
                    },
                    header: {
                        label: 'Name',
                        props: {
                            label: 'Name',
                            onMove: o => this.onMoveColumn(o)
                        }
                    },
                },
                {
                    property: 'company',
                    props: {
                        label: 'Company',
                        style: {
                            width: 100
                        }
                    },
                    header: {
                        label: 'Company',
                        props: {
                            onMove: o => this.onMoveColumn(o)
                        }
                    }
                },
                {
                    property: 'sentence',
                    props: {
                        style: {
                            width: 300
                        }
                    },
                    header: {
                        label: 'Sentence',
                        props: {
                            label: 'Sentence',
                            onMove: o => this.onMoveColumn(o)
                        }
                    }
                }
            ],
            rows
        };

        this.onMoveColumn = this.onMoveColumn.bind(this);
    }
    render() {
        const renderers = {
            header: {
                cell: dnd.Header
            }
        };
        const { columns, rows } = this.state;
        const resolvedColumns = resolve.columnChildren({ columns });
        const resolvedRows = resolve.resolve({
            columns: resolvedColumns,
            method: resolve.nested
        })(rows);

        return (
            <Table.Provider
                renderers={renderers}
                columns={resolvedColumns}
            >
                <Table.Header
                    headerRows={resolve.headerRows({ columns })}
                />

                <Table.Body
                    rows={resolvedRows}
                    rowKey="id"
                    onRow={this.onRow}
                />
            </Table.Provider>
        );
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
}

// Set up drag and drop context
const DragAndDrop = DragDropContext(HTML5Backend)(DragAndDropTable);
        export default DragAndDrop;