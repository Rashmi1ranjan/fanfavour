import React, { useState } from 'react'
import { observer } from 'mobx-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import RootStore from '../../store/Root'
import Loader from '../loader/Loader'
import moment from 'moment'
import styled from 'styled-components'

interface Props {
    setShowAddNotePopup: (key: boolean) => void,
    userId: string,
    rootStore: RootStore
}

const ClosePopupDiv = styled.div<{ loader?: boolean }>`
    pointer-events: ${props => props.loader ? 'none' : 'auto'};
    cursor: pointer;
    color: ${props => props.loader ? '#d3d3d3' : ''};
`

const NotesDiv = styled.div<{ bottomBorder?: boolean }>`
    border-bottom: ${props => props.bottomBorder ? '1px solid #d3d3d3' : '' };
`

const AddNotePopup: React.FC<Props> = (props) => {
    const { userId, setShowAddNotePopup, rootStore } = props
    const { UniversalLoginStore } = rootStore
    const {
        noteData,
        addNewNote,
        addNoteLoading,
        notes,
        fetchNoteLoader
    } = UniversalLoginStore

    const addUserNewNote = (e: any) => {
        e.preventDefault()
        if (noteData.noteText.trim() === '') {
            return alert('Note can not be empty.')
        }
        noteData.userId = userId
        addNewNote()
    }

    return <div className='modal fade show' role='dialog' style={{ display: 'block', backgroundColor: '#00000080' }}>
        <div className='modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl'>
            <div className='modal-content'>
                <div className='modal-header' style={{ justifyContent: 'space-between' }}>
                    <h6 className='modal-title'>Add Note</h6>
                    <ClosePopupDiv className='p-1' loader={addNoteLoading || fetchNoteLoader} onClick={() => setShowAddNotePopup(false)}>
                        <FontAwesomeIcon icon={faXmark} />
                    </ClosePopupDiv>
                </div>
                <div className='modal-body container'>
                    <form autoComplete='off' onSubmit={addUserNewNote}>
                        <div className='row pb-3'>
                            <div className='col-md-9'>
                                <label className='mb-2'>Note</label>
                                <input
                                    name='note'
                                    type='text'
                                    className='form-control'
                                    onChange={(e) => noteData.noteText = e.target.value}
                                    value={noteData.noteText}
                                    disabled={addNoteLoading || fetchNoteLoader}
                                />
                            </div>

                            <div className='col-md-3 mt-2'>
                                <button
                                    type='button'
                                    className='btn btn-primary mt-4'
                                    onClick={addUserNewNote}
                                    disabled={addNoteLoading || fetchNoteLoader}
                                >
                                    Add Note
                                </button>
                            </div>
                        </div>
                    </form>
                    <div className='p-2'>
                        {fetchNoteLoader === true ?
                            <Loader isLoading={fetchNoteLoader} />
                            :
                            notes.length > 0 ? notes.map((item, i) => {
                                return (
                                    <NotesDiv key={i} className='row py-1' bottomBorder={i < notes.length - 1}>
                                        <div className='col-md-8'>{item.note}</div>
                                        <div className='col-md-4'>{moment(item.created_at).format('MM/DD/YYYY HH:mm:ss A')} ({moment(item.created_at).fromNow()})</div>
                                    </NotesDiv>
                                )
                            })
                                :
                                <div className='text-center'>No notes added</div>
                        }
                    </div>
                </div>
            </div>
        </div>
    </div>
}

export default observer(AddNotePopup)
