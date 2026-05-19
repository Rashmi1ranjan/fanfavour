export default function TableCellText(props) {
    let value = props.value || []

    const copyToClipboard = (value) => {
        if (props.auth.user.isAdmin === true) {
            navigator.clipboard.writeText(value)
            props.openCopyToClipboardToast()
        }
    }

    // Convert boolean values to string so that they are visible in table
    if (value === true || value === false) {
        value = value.toString()
    }

    return (
        <div onClick={(e) => { copyToClipboard(value, e) }}>{value}</div>
    )
}