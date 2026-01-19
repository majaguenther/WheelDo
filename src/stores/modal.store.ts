'use client'

import { create } from 'zustand'

type ModalType =
  | 'createTask'
  | 'editTask'
  | 'shareTask'
  | 'createCategory'
  | 'editCategory'
  | 'confirmDelete'
  | null

interface ModalData {
  taskId?: string
  categoryId?: string
  onConfirm?: () => void | Promise<void>
  title?: string
  message?: string
}

interface ModalState {
  activeModal: ModalType
  modalData: ModalData | null
  isClosing: boolean

  // Actions
  openModal: (type: ModalType, data?: ModalData) => void
  closeModal: () => void
  setIsClosing: (closing: boolean) => void
}

export const useModalStore = create<ModalState>((set) => ({
  activeModal: null,
  modalData: null,
  isClosing: false,

  openModal: (type, data) =>
    set({
      activeModal: type,
      modalData: data ?? null,
      isClosing: false,
    }),

  closeModal: () =>
    set({
      activeModal: null,
      modalData: null,
      isClosing: false,
    }),

  setIsClosing: (closing) => set({ isClosing: closing }),
}))

// Convenience hooks for specific modals
export const useCreateTaskModal = () => {
  const { activeModal, openModal, closeModal } = useModalStore()
  return {
    isOpen: activeModal === 'createTask',
    open: (data?: ModalData) => openModal('createTask', data),
    close: closeModal,
  }
}

export const useEditTaskModal = () => {
  const { activeModal, modalData, openModal, closeModal } = useModalStore()
  return {
    isOpen: activeModal === 'editTask',
    taskId: modalData?.taskId,
    open: (taskId: string) => openModal('editTask', { taskId }),
    close: closeModal,
  }
}

export const useShareTaskModal = () => {
  const { activeModal, modalData, openModal, closeModal } = useModalStore()
  return {
    isOpen: activeModal === 'shareTask',
    taskId: modalData?.taskId,
    open: (taskId: string) => openModal('shareTask', { taskId }),
    close: closeModal,
  }
}

export const useConfirmDeleteModal = () => {
  const { activeModal, modalData, openModal, closeModal } = useModalStore()
  return {
    isOpen: activeModal === 'confirmDelete',
    title: modalData?.title,
    message: modalData?.message,
    onConfirm: modalData?.onConfirm,
    open: (data: { title: string; message: string; onConfirm: () => void | Promise<void> }) =>
      openModal('confirmDelete', data),
    close: closeModal,
  }
}
