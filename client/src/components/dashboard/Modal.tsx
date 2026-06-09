import React from 'react'

interface Props {
    modalTitle: string
    show: boolean
    saveButtonName?: string
    isModalError?: boolean
    modalErrorMessage?: string
    openCloseModal?: () => void
    onSaveModal?: () => void
    children: React.ReactNode
}
const Modal: React.FC<Props> = (props) => {
    const showModal = props.show
    const modalTitle = props.modalTitle
    const saveButtonName = props.saveButtonName || 'Save changes'
    const openCloseModal = props.openCloseModal
    const onSaveModal = props.onSaveModal
    const isModalError = props.isModalError || false
    const modalErrorMessage = props.modalErrorMessage || ''

    let styles = showModal ? { display: "block" } : { display: "none" };
    let modalClass = showModal ? "modal fade in show" : "modal in fade"
    let backDropStyle = showModal ? { opacity: .5 } : { display: "none" };

    return (
        <>
            {showModal && <div className='modal-backdrop' style={backDropStyle}></div>}
            <div id="myModal" className={modalClass} role="dialog" style={styles}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header" style={{ justifyContent: 'space-between' }}>
                            <div className='modal-title'> {modalTitle} </div>
                            <button type="button" className="close" onClick={openCloseModal} data-dismiss="modal" aria-label="Close" style={{ cursor: 'pointer' }}>
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body" >
                            {isModalError && <div className='responsive alert-danger p-3 mb-4 rounded' > {modalErrorMessage} </div>}
                            {props.children}
                        </div>
                        <div className='modal-footer'>
                            <button type="button" className="btn btn-outline-secondary" data-dismiss="modal" onClick={openCloseModal}>Close</button>
                            <button type="button" className="btn btn-outline-primary" onClick={onSaveModal}>{saveButtonName}</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Modal