'use client'

import { useEffect } from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { X } from 'lucide-react'

export default function ModalPopUp(props) {
  const {
    open = true,
    handleClose,
    title,
    popup_title = '',
    children,
    classes = '',
    modalBodyMaxHeight = '70vh',
    showCloseBtn = true,
    isLoading = false,
    showHeader = true,
  } = props

  /* 🔒 Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'visible'
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="p-4 md:p-0 border-0 bg-transparent shadow-none max-w-none line-scrollbar"
        showCloseButton={false}
      >
        {/* Backdrop */}
        <div className="inset-0 z-50 flex items-center justify-center">
          {/* Modal */}
          <div className="relative shadow-lg w-full max-h-[90vh] bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 bg-[linear-gradient(525deg,#170c3e,#120629)]">
            {/* Header */}
            {showHeader && (
              <>
                <DialogHeader className='flex flex-row items-center justify-between p-4 cursor-pointer'>
                  {/* Title */}
                  <DialogTitle className='text-base text-white'>
                    {title}
                  </DialogTitle>

                  {/* Close Button */}
                  {showCloseBtn && (
                    <DialogClose asChild>
                      <button
                        disabled={isLoading}
                        onClick={handleClose}
                        className='text-white hover:opacity-80 cursor-pointer'
                      >
                        <X className='h-5 w-5' />
                      </button>
                    </DialogClose>
                  )}
                </DialogHeader>
                {showCloseBtn &&
                  <div className='border-b-[2px] border-[#D9D9D9]/50'></div>
                }
              </>
            )}
            {/* Body */}
            <div className="overflow-y-auto p-4" style={{ maxHeight: modalBodyMaxHeight }}>
              {children}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
