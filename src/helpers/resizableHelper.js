import classNames from 'classnames';
import * as stylesheet from 'stylesheet-helpers';

export default function resizableHelper({ globalId, getId }) {
    // Create a custom stylesheet for tracking styles.
    // Without creating a custom one we would need to modify
    // an existing one.
    //
    // This can fail on old IE due to low maximum stylesheet limit.
    const { styleSheetElement, styleSheet } = stylesheet.create();

    return {

        initialize(columns) {
            // using leaf index ref, check either leaf column or not
            let leafIndex = 0;

            // before return columns, give style to column including children
            loopColumns({ columns }, (column) => {
                let currentColumn = column;

                if (!currentColumn.children) {
                    currentColumn.leafIndex = leafIndex;
                    leafIndex += 1;
                }
                if (typeof currentColumn.leafIndex !== 'undefined') {
                    const className = getClassName(globalId, getId(column, column.leafIndex));
                    updateWidth({
                        styleSheet,
                        className,
                        width: column.width
                    });

                    currentColumn = Object.assign(currentColumn, {
                        props: {
                            ...currentColumn.props,
                            className: classNames(column.props && column.props.className, className)
                        }
                    });

                    delete currentColumn.leafIndex;
                }
            });

            return columns.map(function (column) {
                return column;
            });
        },
        cleanup() {
            styleSheetElement.remove();
        },
        update({ column, width }) {
            updateWidth({
                styleSheet,
                className: getClassName(globalId, getId(column)),
                width
            });
        },
        updateByMultiplier({ column, multiplier }) {
            let rule = stylesheet.findExistingRule(window, styleSheet, getClassName(globalId, getId(column)));
            console.log("rule", rule.style.width)
            let w = parseInt(rule.style.width, 10)
            console.log(w * multiplier)
            updateWidth({
                styleSheet,
                className: getClassName(globalId, getId(column)),
                width: w * multiplier
            });
        },
        updateByIncrement({ column, inc }) {
        let rule = stylesheet.findExistingRule(window, styleSheet, getClassName(globalId, getId(column)));
        let w = parseFloat(rule.style.width, 10)
        //console.log(rule.style.width + " - " + w)
        updateWidth({
            styleSheet,
            className: getClassName(globalId, getId(column)),
            width: w + inc
        });
    }
    };
}

function getClassName(globalId, localId) {
    return `column-${globalId}-${localId}`;
}

function updateWidth({
                         styleSheet,
                         className,
                         width
                     }) {
    stylesheet.updateProperties(
        window,
        styleSheet,
        className,
        {
            width: `${width}px`,
            minWidth: `${width}px`,
            maxWidth: `${width}px`
        }
    );
}

function loopColumns({
                         columns,
                         childrenField = 'children'
                     }, callback) {
    if (!columns) {
        throw new Error('loopColumns - Missing columns!');
    }

    columns.forEach((column, index) => {
        callback && callback(column, index);

        if (column.children && column.children.length) {
            loopColumns({ columns: column.children, childrenField }, callback);
        }
    });
}