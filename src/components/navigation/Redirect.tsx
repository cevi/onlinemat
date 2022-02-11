import { Spin } from "antd";
import classNames from "classnames";
import { useUser } from "hooks/use-user";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import appStyles from 'styles.module.scss';



export const Redirect = () => {

    const navigate = useNavigate();

    const userState = useUser();

    useEffect(()=> {

        if(userState.loading || !userState.appUser) return;

        if(userState.appUser.userData.defaultAbteilung) {
            navigate(`/abteilungen/${userState.appUser.userData.defaultAbteilung}`);
        } else {
            navigate('/');
        }

    }, [userState])

    return <div className={classNames(appStyles['flex-grower'], appStyles['center-container'])}><Spin/></div>

}