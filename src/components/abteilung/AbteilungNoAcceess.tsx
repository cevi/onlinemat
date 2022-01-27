import { Result, Tag } from "antd";
import { useUser } from "hooks/use-user";
import { Abteilung } from "types/abteilung.type";
import { JoinAbteilungButton } from "./join/JoinAbteilung";

export interface NoAccessToAbteilungProps {
    abteilung: Abteilung
}

export const NoAccessToAbteilung = (props: NoAccessToAbteilungProps) => {

    const { abteilung } = props;

    const user = useUser();

    const userRole = user.appUser?.userData['roles'] ? user.appUser?.userData?.roles[abteilung.id] : ''

    return <Result
        status='warning'
        title='Du hast keine Berechtigungen für diese Abteilung'
        extra={
            <>
                {
                    userRole !== 'pending' ? <JoinAbteilungButton abteilungId={abteilung.id} abteilungName={abteilung.name} /> : <Tag color='geekblue'>Angefragt</Tag>
                }

                {
                    abteilung.email && <p>{`Oder schreibe eine email an `}<a href={`mailto:${abteilung.email}`}>{abteilung.email}</a></p> 
                }
            </>
        }
    />
}