import React from 'react'
import { Link } from 'react-router-dom'
import _ from 'lodash'

interface Props {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    links: Array<any>
}

const Breadcrumb: React.FC<Props> = (props) => {
    const links = props.links || []

    return (
        <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
                {links.map((item) => {
                    const isActive = _.get(item, 'isActive', false)
                    const name = _.get(item, 'name', '')
                    const to = _.get(item, 'to', '#')
                    if (isActive) {
                        return (
                            <li key={name} className="breadcrumb-item active" aria-current="page">
                                {name}
                            </li>
                        )
                    }
                    return (
                        <li key={name} className="breadcrumb-item" aria-current="page">
                            <Link to={to}>{name}</Link>
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}

export default Breadcrumb