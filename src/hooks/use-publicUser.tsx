import { useSelector } from 'react-redux';
import { ApplicationState } from 'config/redux';

export const usePublicUsers = () => {
    const publicUsers = useSelector((state: ApplicationState) => state.publicUsers);
    return publicUsers;
}
