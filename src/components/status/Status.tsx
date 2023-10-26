import { Tag } from 'antd'
import generatedGitInfo from 'generatedGitInfo.json';

export const StatusPage = () => {
    return <div style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{display: 'flex', justifyContent: 'center'}}>
            Branch: <Tag>{generatedGitInfo.gitBranch}</Tag>
            Git Hash: <Tag>{generatedGitInfo.gitCommitHash}</Tag>
        </div>
    </div>
}