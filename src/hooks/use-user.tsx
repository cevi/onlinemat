import { useSelector } from 'react-redux';
import { ApplicationState } from 'config/redux';

export const useUser = () => {
    const user = useSelector((state: ApplicationState) => state.user);
    return user;
}
