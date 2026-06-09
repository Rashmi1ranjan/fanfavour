import React, { useEffect } from 'react'
import { observer } from 'mobx-react'
import Select from 'react-select'
import PropTypes from 'prop-types'
import _ from 'lodash'
import e from 'express'
import { OptionType, WebsiteOption } from '../../types/types'

// TODO : assign type
const Domain = (props: any) => {
    const { onDomainChange, name, defaultDomain, loading, multiSelect, requestFromCron, websiteStore, requestFrom } = props
    const { getAllWebsiteOptions, allWebsitesOptions } = websiteStore
    const fromCronRequest = _.defaultTo(requestFromCron, false)

    useEffect(() => {
        getAllWebsiteOptions()
    }, [getAllWebsiteOptions])

    let options: OptionType[] = [{ label: 'All', value: '' }]

    if (fromCronRequest === true) {
        options = [{ label: 'services', value: 'services' }]
    }

    if (requestFrom === 'referral_history') {
        options = [{ label: 'All', value: 'all' }]
    }

    const websiteOptions: OptionType[] = allWebsitesOptions.map((option: WebsiteOption, index: number) => (
        { label: `${index + 1}. ${option.website_url}`, value: option.website_url }
    ))
    options.push(...websiteOptions)

    let selectedOption
    if (_.isEmpty(defaultDomain) && multiSelect === false) {
        selectedOption = { label: 'All', value: '' }
    }

    let setWebsiteOption = websiteOptions
    if (fromCronRequest === true || multiSelect === false) {
        setWebsiteOption = options
    }

    const selectedOptions: OptionType[] = []
    if (multiSelect === true) {
        const selectedValue = setWebsiteOption.filter(item =>
            defaultDomain.includes(item.value))
        selectedOptions.push(...selectedValue)
    } else {
        const selectedValue = setWebsiteOption.filter(item =>
            defaultDomain === item.value)
        selectedOptions.push(...selectedValue)
    }

    return (
        <Select
            name={name ? name : 'domain'}
            options={setWebsiteOption}
            onChange={onDomainChange}
            className='mb-3'
            defaultValue={!_.isEmpty(defaultDomain) ? selectedOptions : selectedOption}
            isDisabled={loading}
            isMulti={multiSelect}
        />
    )
}

Domain.propTypes = {
    websiteStore: PropTypes.any,
    onDomainChange: PropTypes.func,
    name: PropTypes.string,
    defaultDomain: PropTypes.any,
    loading: PropTypes.bool,
    multiSelect: PropTypes.bool,
    requestFromCron: PropTypes.bool,
    value: PropTypes.string,
    requestFrom: PropTypes.string
}

export default observer(Domain)
