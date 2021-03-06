/**@jsx jsx*/
import {css, jsx} from "@emotion/core";
import {useTheme} from "emotion-theming";
import {useContext} from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import TableContext from "../../../TableContext";
import {
    setSorting,
    addSorting,
    changeFilter,
} from "../../../actions";
import Filter from "../../Filter"
import SortIcon from "../../SortIcon";


const emptyList = []

const DefaultHeaderCell = ({accessor}) => {
    const {state: {filters, columnsSettings, filtersSettings, dimensions: {tBodyBoxHeight}, isSaving}, dispatch, updateFilterList, emptyWildcard, emptyValueWildcard} = useContext(TableContext)
    const {title, sortable, filterable, width} = columnsSettings[accessor]
    const filterList = filterable && (filters[accessor].list || emptyList)
    const loadingState = filterable && filters[accessor].isLoading

    const onChangeFilterHandler = ({accessor, filterBy, type, value, selectAllState}) => {
        dispatch(changeFilter({accessor, type, value, selectAllState}))
    }
    const onOpenFilter = ({accessor}) => {
        updateFilterList({accessor})
    }
    const isFilterActive = ({accessor}) => filters[accessor].value.length > 0

    const handlerOnClick = (e) => {
        if (e.ctrlKey) {
            dispatch(addSorting(accessor))
        } else {
            dispatch(setSorting(accessor))
            // invalidateDataWithTimeout(TIMEOUT_CHANGE_SORTING)
        }
    }
    const thm = useTheme()
    const thCss = css`
      width: ${width}px;
      cursor: default;
    `
    const iconWrapCss = css`
      margin-left: 5px;
      width: 25px;
      opacity: 0.7;
      color: ${thm.hd.iconColor}
    `
    const filterListMaxHeight = tBodyBoxHeight - 70 > 20 ? tBodyBoxHeight - 70 : 20
    return (
        <th css={thCss} className={classNames('align-top')} onClick={!isSaving && sortable ? handlerOnClick : undefined} >
            <div className={classNames('d-flex', 'justify-content-between')}>
                <div className={classNames('d-flex', 'justify-content-start', 'text-break')}>
                    {title}
                    <div css={iconWrapCss} className={classNames('d-flex', 'justify-content-around', 'align-items-center')}>
                        {sortable && <SortIcon accessor={accessor} />}
                    </div>
                </div>
                {filterable && <Filter accessor={accessor} active={isFilterActive({accessor})} disabled={isSaving} maxWidth={300} maxHeight={filterListMaxHeight} data={filterList} direction="down" filterSettings={filtersSettings[accessor]} onChangeFilter={onChangeFilterHandler} onOpen={onOpenFilter} loadingState={loadingState} emptyWildcard={emptyWildcard} emptyValueWildcard={emptyValueWildcard} />}
            </div>
        </th>
    )
}

DefaultHeaderCell.propTypes = {
    accessor: PropTypes.string,
    renderSortIcon: PropTypes.func
}
export default DefaultHeaderCell