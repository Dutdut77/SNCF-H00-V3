export function useLoader() {

    const loading = useState('loading', () => false)

    const setLoader =  (request) => {
            loading.value = request
    }

    return { loading, setLoader }
    
}