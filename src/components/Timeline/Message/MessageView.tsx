import { Box, IconButton, ListItem, Typography, Chip, Paper, Tooltip } from '@mui/material'
import { Link as routerLink } from 'react-router-dom'
import { useApi } from '../../../context/api'
import { CCAvatar } from '../../CCAvatar'
import type { Character, Message as CCMessage, ProfileWithAddress, Stream } from '../../../model'
import { SimpleNote } from '../SimpleNote'
import type { SimpleNote as TypeSimpleNote } from '../../../schemas/simpleNote'
import type { Profile } from '../../../schemas/profile'
import { MessageHeader } from './MessageHeader'
import { MessageActions } from './MessageActions'
import { MessageReactions } from './MessageReactions'
import type { ReplyMessage } from '../../../schemas/replyMessage'
import { useSnackbar } from 'notistack'
import { FollowButton } from '../../FollowButton'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'

export interface MessageViewProps {
    message: CCMessage<TypeSimpleNote | ReplyMessage>
    userCCID: string
    author: Character<Profile> | undefined
    favoriteUsers: ProfileWithAddress[]
    reactionUsers: ProfileWithAddress[]
    streams: Array<Stream<any>>
    beforeMessage?: JSX.Element
}

export const MessageView = (props: MessageViewProps): JSX.Element => {
    const api = useApi()
    const { enqueueSnackbar } = useSnackbar()
    const isSelf = props.message.author === api.userAddress

    return (
        <ListItem
            sx={{
                wordBreak: 'break-word',
                alignItems: 'flex-start',
                flex: 1,
                gap: { xs: 1, sm: 2 }
            }}
            disablePadding
        >
            {props.message?.payload?.body && (
                <>
                    <Tooltip
                        enterDelay={500}
                        enterNextDelay={500}
                        placement="top"
                        components={{
                            Tooltip: Paper
                        }}
                        componentsProps={{
                            tooltip: {
                                sx: {
                                    p: 1,
                                    m: 1,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    minWidth: '300px'
                                }
                            }
                        }}
                        title={
                            <Box display="flex" flexDirection="column" alignItems="left" sx={{ m: 1 }} gap={1}>
                                <Box
                                    display="flex"
                                    flexDirection="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                >
                                    <CCAvatar
                                        alt={props.author?.payload.body.username}
                                        avatarURL={props.author?.payload.body.avatar}
                                        identiconSource={props.message.author}
                                        sx={{
                                            width: { xs: '38px', sm: '48px' },
                                            height: { xs: '38px', sm: '48px' }
                                        }}
                                    />
                                    {!isSelf && <FollowButton userCCID={props.message.author} color="primary.main" />}
                                </Box>
                                <Box
                                    display="flex"
                                    flexDirection="row"
                                    alignItems="center"
                                    gap={1}
                                    justifyContent="space-between"
                                >
                                    <Typography variant="h2">{props.author?.payload.body.username}</Typography>
                                    <Chip
                                        size="small"
                                        label={`${props.message.author.slice(0, 9)}...`}
                                        deleteIcon={<ContentPasteIcon />}
                                        onDelete={() => {
                                            navigator.clipboard.writeText(props.message.author)
                                            enqueueSnackbar('Copied', { variant: 'info' })
                                        }}
                                    />
                                </Box>
                                <Typography variant="body1">{props.author?.payload.body.description}</Typography>
                            </Box>
                        }
                    >
                        <IconButton
                            sx={{
                                width: { xs: '38px', sm: '48px' },
                                height: { xs: '38px', sm: '48px' },
                                mt: { xs: '3px', sm: '5px' }
                            }}
                            component={routerLink}
                            to={'/entity/' + props.message.author}
                        >
                            <CCAvatar
                                alt={props.author?.payload.body.username}
                                avatarURL={props.author?.payload.body.avatar}
                                identiconSource={props.message.author}
                                sx={{
                                    width: { xs: '38px', sm: '48px' },
                                    height: { xs: '38px', sm: '48px' }
                                }}
                            />
                        </IconButton>
                    </Tooltip>
                    <Box
                        sx={{
                            display: 'flex',
                            flex: 1,
                            flexDirection: 'column',
                            width: '100%',
                            overflow: 'auto'
                        }}
                    >
                        <MessageHeader
                            authorID={props.message.author}
                            messageID={props.message.id}
                            cdate={props.message.cdate}
                            username={props.author?.payload.body.username}
                        />
                        {props.beforeMessage}
                        <SimpleNote message={props.message} />
                        <MessageReactions message={props.message} emojiUsers={props.reactionUsers} />
                        <MessageActions
                            favoriteUsers={props.favoriteUsers}
                            message={props.message}
                            msgstreams={props.streams}
                            userCCID={props.userCCID}
                        />
                    </Box>
                </>
            )}
        </ListItem>
    )
}
