import axios from 'axios'

export const defaultTableDataLoader = async ({url, filters, sorting, pagination, dataFieldName, dataCounterFieldName}) => {
    try {
        const res = await axios.get(url, {
            params: {filters, sorting, pagination}
        })
        if (!Array.isArray(res.data[dataFieldName])) {
            console.log('invalid data from server: ', res)
            throw new Error('Error fetching data from server')
        }
        return res.data
    } catch (e) {
        alert(e.toString())
        return []
    }
}
export const defaultFilterDataLoader = async ({url, filters, accessor, dataFieldName}) => {
    try {
        const res = await axios.get(url, {
            params: {accessor, filters}
        })
        if (!Array.isArray(res.data[dataFieldName])) {
            console.log('invalid data from server: ', res)
            throw new Error('Error fetching filter list from server')
        }
        return res.data[dataFieldName]
    } catch (e) {
        alert(e.toString())
        return []
    }
}