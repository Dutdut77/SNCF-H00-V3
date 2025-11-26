export const useToast = () => {

    const items = useState('items', () => [])

    const addToast =  (toast = {}) => {
            const duration = typeof toast.duration === 'number' ? toast.duration : 3000

            items.value.unshift({
                key : Symbol(),
                ...toast,
                duration
            })
    }

    const removeToast = (index) => {
        items.value.splice(index, 1)
    }

    return { items, addToast, removeToast }
    
}