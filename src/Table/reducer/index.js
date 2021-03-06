import check from 'check-types'
import {
    CTRL_DOWN,
    CTRL_UP,
    PAGE_RESIZING,
    SET_SCROLL_SIZES,
    TABLE_RESIZING,
    SET_SORTING,
    ADD_SORTING,
    INVALIDATE_DATA,
    RESET_INVALIDATE_DELAY,
    LOADING_DATA,
    REQUEST_DATA,
    RECEIVE_DATA,
    CHANGE_FILTER,
    LOADING_FILTER_LIST,
    REQUEST_FILTER_LIST,
    RECEIVE_FILTER_LIST,
    FIRST_PAGE,
    LAST_PAGE,
    NEXT_PAGE,
    PREV_PAGE,
    CHANGE_ROWS_ON_PAGE,
    SELECT_CELL,
    DESELECT_CELL,
    SELECT_ROW,
    DESELECT_ROW,
    EDIT_CELL,
    IS_SAVING,
    FINISH_EDIT_CELL,
    SAVE_DATA_LOCAL
} from "../constatnts/actions";
import {
    calculateColumnsDim,
    tableWidth,
    changeSorting,
    app_changeFilter, app_filters_setFilterInLoadingState, app_filters_receiveFilterList, app_updatePagination,
    changeData,
    startEditCell, stopEditCell
} from "../helpers";

// import {changeSorting} from "../helpers/sortingHandler";
import {loadingData, receiveData, loadingFilterList, receiveFilterList} from "../actions";
import {
    TIMEOUT_CHANGE_PAGE_IN_PAGINATION,
    TIMEOUT_CHANGE_ROWS_ON_PAGE,
    TIMEOUT_CHANGE_SORTING
} from "../constatnts/timeouts";
import {changeSelectedCells} from "../helpers";

/**
 * using for dispatching async actions like request data from server
 * @param dispatch
 * @return {Function}
 */
export function dispatchMiddleware(dispatch) {
    async function getData({dispatch, url, fetchFunction, filters, extFilters, sorting, pagination, dataFieldName, dataCounterFieldName, isTableMountedRef, onAfterSuccessfulRequestData, onAfterFailedRequestData, onAfterRequestData}) {
        dispatch(loadingData())
        try {
            const data = await fetchFunction({url, filters, extFilters, sorting, pagination, dataFieldName, dataCounterFieldName})
            if (check.array(data) && isTableMountedRef.current) {
                dispatch(receiveData({data: data, recordsCounter: data.length, showPagination: false, isTableMountedRef}))
                if (check.function(onAfterSuccessfulRequestData)) onAfterSuccessfulRequestData()
            } else if (check.object(data) && check.array(data[dataFieldName]) && isTableMountedRef.current) {
                dispatch(receiveData({
                    data: data[dataFieldName],
                    recordsCounter: check.number(data[dataCounterFieldName]) ? data[dataCounterFieldName] : null,
                    showRecordsCounter: check.number(data[dataCounterFieldName]),
                    showPagination: check.number(data[dataCounterFieldName]),
                    isTableMountedRef
                }))
                if (check.function(onAfterSuccessfulRequestData)) onAfterSuccessfulRequestData()
            } else if (isTableMountedRef.current) {
                console.log('Table: Invalid format of fetched data: ', data, dataFieldName, dataCounterFieldName, data[dataCounterFieldName] )
                throw  new Error('Table: Invalid format of fetched data from server!')
            }
            if (check.function(onAfterRequestData)) onAfterRequestData()
        } catch (e) {
            if (isTableMountedRef.current) {
                alert(e.toString())
                dispatch(receiveData({data: [], recordsCounter: null, showPagination: false, isTableMountedRef}))
                if (check.function(onAfterFailedRequestData)) onAfterFailedRequestData()
            }

        }
    }
    async function getFilterList({dispatch, url, fetchFunction, filters, extFilters, accessor, dataFieldName, isTableMountedRef}) {
        dispatch(loadingFilterList(accessor))
        const tmp = Object.keys(filters).reduce((acc, key) => {
            if (key !==accessor) acc[key] = filters[key]
            return acc
        }, {})
        try {
            const data = await fetchFunction({url, filters: tmp, extFilters, accessor, dataFieldName})
            if (check.not.array(data)) {
                console.log('Table: Error fetching filter data: ', data)
                throw  new Error('Table: Error fetching filter data from server!')
            }
            if (isTableMountedRef.current) dispatch(receiveFilterList({accessor, data}))
        } catch (e) {
            if (isTableMountedRef.current) {
                alert(e.toString())
                dispatch(receiveFilterList({accessor, data:[]}))
            }

        }
    }
    return (action) => {
        const {type, payload} = action
        const {url, fetchFunction, filters, extFilters, sorting, pagination, accessor, dataFieldName, dataCounterFieldName, isTableMountedRef, onAfterSuccessfulRequestData, onAfterFailedRequestData, onAfterRequestData} = payload || {}
        switch (type) {
            case REQUEST_DATA:
                return getData({dispatch, url, fetchFunction, filters, extFilters, sorting, pagination, dataFieldName, dataCounterFieldName, isTableMountedRef, onAfterSuccessfulRequestData, onAfterFailedRequestData, onAfterRequestData})
            case REQUEST_FILTER_LIST:
                return getFilterList({dispatch, url, fetchFunction, filters, extFilters, accessor, dataFieldName, isTableMountedRef})
            default:
                return dispatch(action)
        }
    }
}
export const rootReducer = (state, action) => {
    const {payload, type} = action
    const {isSaving, dimensions, columnsSettings, sorting, filters, pagination, filtersSettings, didInvalidate, cellsInEditMode} = state
    const {rowId, accessor, data, value, showPagination, showRecordsCounter} = payload || {}
    switch (type) {
        case CTRL_DOWN:
            return {...state, isCtrlPressed: true}
        case CTRL_UP:
            return {...state, isCtrlPressed: false}
        case SET_SCROLL_SIZES:
            const {vScroll, hScroll} = payload
            return {...state, dimensions: {...dimensions, vScroll, hScroll}}
        case PAGE_RESIZING:
            const {tBoxWidth, tBoxHeight, tBodyBoxWidth, tBodyBoxHeight} = payload
            return {...state, dimensions: {...dimensions, tBoxWidth, tBoxHeight, tBodyBoxWidth, tBodyBoxHeight}}
        case TABLE_RESIZING:
            const newDimensions = calculateColumnsDim({tBoxWidth: dimensions.tBoxWidth, vScroll: dimensions.vScroll, columnsSettings})
            const keys = Object.keys(newDimensions)
            const newColumnsSettings = {}
            Object.entries(columnsSettings).forEach(([accessor, settings]) => {
                newColumnsSettings[accessor] = keys.includes(accessor) ? {...settings, width: newDimensions[accessor].width} : settings
            })
            const newTableWidth = tableWidth({columnsSettings: newColumnsSettings})
            return {...state, dimensions: {...dimensions, tWidth: newTableWidth}, columnsSettings: newColumnsSettings}
        case SET_SORTING:
            return {...state, sorting: changeSorting({sorting, accessor: payload}), invalidateWithDelay: TIMEOUT_CHANGE_SORTING}
        case ADD_SORTING:
            return {...state, sorting: changeSorting({sorting, accessor: payload, appendMode: true}), invalidateWithDelay: TIMEOUT_CHANGE_SORTING}
// data handling
        case INVALIDATE_DATA:
            return {...state, didInvalidate: true, invalidateWithDelay: null}
        case RESET_INVALIDATE_DELAY:
            return {...state, invalidateWithDelay: false}
        case LOADING_DATA:
            return {...state, isLoading: true, didInvalidate: false}
        case RECEIVE_DATA:
            return {...state, isLoading: false, didInvalidate: false, data: payload.data, pagination: app_updatePagination({pagination, recordsCounter: payload.recordsCounter}), showPagination, showRecordsCounter}
        case CHANGE_FILTER:
            const result = {...state,
                ...app_changeFilter({state, accessor: payload.accessor, type: payload.type, value: payload.value, selectAllState: payload.selectAllState})
            }
            return result
        case LOADING_FILTER_LIST:
            return {...state, filters: app_filters_setFilterInLoadingState({filters: state.filters, accessor: payload})}
        case RECEIVE_FILTER_LIST:
            return {...state, filters: app_filters_receiveFilterList({filters: state.filters, accessor: payload.accessor, data: payload.data})}
        // pagination's actions
        case FIRST_PAGE:
            return {...state, pagination: {...pagination, currentPage: 1}, invalidateWithDelay: TIMEOUT_CHANGE_PAGE_IN_PAGINATION}
        case LAST_PAGE:
            return {...state, pagination: {...pagination, currentPage: pagination.totalPages}, invalidateWithDelay: TIMEOUT_CHANGE_PAGE_IN_PAGINATION}
        case NEXT_PAGE:
            return {...state, pagination: {...pagination, currentPage: pagination.currentPage + 1}, invalidateWithDelay: TIMEOUT_CHANGE_PAGE_IN_PAGINATION}
        case PREV_PAGE:
            return {...state, pagination: {...pagination, currentPage: pagination.currentPage - 1}, invalidateWithDelay: TIMEOUT_CHANGE_PAGE_IN_PAGINATION}
        case CHANGE_ROWS_ON_PAGE:
            return {...state, pagination:app_updatePagination({pagination, recordsCounter: pagination.recordsCounter, rowsOnPage: payload}), invalidateWithDelay: TIMEOUT_CHANGE_ROWS_ON_PAGE}
        case SELECT_CELL:
            const res = changeSelectedCells({selectedCells: state.selectedCells, isCtrlPressed: state.isCtrlPressed, rowId: payload.rowId, accessor: payload.accessor})
            return {...state, selectedCells: res, lastSelectedCell: {[payload.rowId]: payload.accessor}}
        case EDIT_CELL:
            return {...state, cellsInEditMode: startEditCell({cellsInEditMode, rowId, accessor})}
        case FINISH_EDIT_CELL:
            return {...state, cellsInEditMode: stopEditCell({cellsInEditMode, rowId, accessor})}
        case SAVE_DATA_LOCAL:
            return {...state, data: changeData({data: state.data, rowData: payload.rowData, rowId: payload.rowId, accessor: payload.accessor, cellData: payload.cellData})}
        case IS_SAVING:
            return {...state, isSaving: payload}
        default:
            return state
    }
}
