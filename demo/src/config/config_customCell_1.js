import React from 'react'
import ft from "../constants/filterTypes"
import {fetchTableData, fetchFilterList} from "../async"
import {Cell1} from "../customComponents/Cell1"

const config = {
    tableDataLoader: fetchTableData,
    filterDataLoader: fetchFilterList,
    tableDataUrl: 'http://table.data.url',
    filterDataUrl: 'http://filter.data.url',
    columns: [
        {
            accessor: 'column1',
            title: 'column 1',
            minWidth: 300,
            maxWidth: 450,
            sortable: true,
            filterable: true,
            filter: {
                filterBy: 'column1',
                type: 'LIST',
                allowedTypes: [ft.EQ.value, ft.LIST.value]
            },
            customCell: Cell1
        },
        {
            accessor: 'column2',
            title: 'column 2',
            minWidth: 400,
            maxWidth: 500,
            sortable: true,
            filterable: true
        },
        {
            accessor: 'column3',
            title: 'column 3',
            minWidth: 400,
            maxWidth: 500,
            sortable: true,
            filterable: true
        },
        {
            accessor: 'column4',
            title: 'column 4',
            minWidth: 400,
            maxWidth: 500,
            sortable: true,
            filterable: true
        },
    ]
}
export default config