import { memo, useCallback, useEffect, useState } from 'react'
import type { Association, Character, Message, StreamElement, CCID, ProfileWithAddress } from '../../model'
import { useApi } from '../../context/api'
import { Schemas } from '../../schemas'
import { Box, IconButton, ListItem, ListItemButton, Typography, useTheme } from '@mui/material'
import type { Profile } from '../../schemas/profile'
import { Link as routerLink } from 'react-router-dom'
import { CCAvatar } from '../CCAvatar'
import { MessageFrame } from './Message/MessageFrame'
import { MessageView } from './Message/MessageView'
import { useInspector } from '../../context/Inspector'
import { useMessageDetail } from '../../context/MessageDetail'
import { ReRouteMessageFrame } from './Message/ReRouteMessageFrame'
import { MessageSkeleton } from '../MessageSkeleton'

export interface AssociationFrameProp {
    association: StreamElement
    lastUpdated: number
    after: JSX.Element | undefined
}

export const AssociationFrame = memo<AssociationFrameProp>((props: AssociationFrameProp): JSX.Element | null => {
    const api = useApi()
    const theme = useTheme()
    const inspector = useInspector()
    const messageDetail = useMessageDetail()
    const [author, setAuthor] = useState<Character<Profile> | undefined>()
    const [message, setMessage] = useState<Message<any> | undefined>()
    const [association, setAssociation] = useState<Association<any> | undefined>()
    const [fetching, setFetching] = useState<boolean>(true)

    // TODO いずれ消す
    const [replyMessage, setReplyMessage] = useState<Message<any> | undefined>()
    const [messageAnchor, setMessageAnchor] = useState<null | HTMLElement>(null)

    const isMeToOther = association?.author !== api.userAddress

    const [reRouteMessage, setReRouteMessage] = useState<Message<any> | undefined>()

    // TODO いずれ消す
    const [reactUsers, setReactUsers] = useState<ProfileWithAddress[]>([])
    const [hasOwnReaction, setHasOwnReaction] = useState<boolean>(false)
    const [emojiPickerAnchor, setEmojiPickerAnchor] = useState<null | HTMLElement>(null)
    const [emojiUsers, setEmojiUsers] = useState<ProfileWithAddress[]>([])

    useEffect(() => {
        api.fetchAssociation(props.association.id, props.association.currenthost)
            .then((a) => {
                if (!a) return
                setAssociation(a)

                if (a?.schema === Schemas.replyAssociation) {
                    api.fetchMessageWithAuthor(a.payload.body.messageId, a.author).then((m) => {
                        setMessage(m)
                    })

                    api.fetchMessageWithAuthor(a.targetID, a.payload.body.messageAuthor).then((m) => {
                        setReplyMessage(m)
                    })

                    api.readCharacter(a.payload.body.messageAuthor, Schemas.profile).then((author) => {
                        setAuthor(author)
                    })

                    return
                }

                if (a?.schema === Schemas.reRouteAssociation) {
                    api.fetchMessageWithAuthor(a.payload.body.messageId, a.payload.body.messageAuthor).then((m) => {
                        setReRouteMessage(m)
                    })
                    return
                }

                api.fetchMessage(a.targetID, props.association.currenthost).then((m) => {
                    setMessage(m)
                    if (!m) return
                    const isMeToOther = a.author !== api.userAddress
                    api.readCharacter(isMeToOther ? a.author : m.author, Schemas.profile).then((author) => {
                        setAuthor(author)
                    })
                })
            })
            .catch((_e) => {
                setAssociation(undefined)
            })
            .finally(() => {
                setFetching(false)
            })
    }, [])

    useEffect(() => {
        const fetchUsers = async (): Promise<any> => {
            const authors = message?.associations.filter((e) => e.schema === Schemas.like).map((m) => m.author) ?? []

            if (
                message?.associations
                    .filter((a) => a.schema === Schemas.like)
                    .find((e) => e.author === api.userAddress) != null
            ) {
                setHasOwnReaction(true)
            } else {
                setHasOwnReaction(false)
            }
            const users = await Promise.all(
                authors.map((ccaddress) =>
                    api.readCharacter(ccaddress, Schemas.profile).then((e) => {
                        return {
                            ccaddress,
                            ...e?.payload.body
                        }
                    })
                )
            )
            setReactUsers(users)
        }

        fetchUsers()
    }, [message?.associations, message])

    const favorite = useCallback(
        async ({ id, author }: { id: string; author: CCID }): Promise<void> => {
            await api.favoriteMessage(id, author)
            api.fetchMessageWithAuthor(association?.payload.body.messageId, association?.author ?? '').then((m) => {
                setMessage(m)
            })
        },
        [association]
    )

    const unfavorite = useCallback(
        (deletekey: string | undefined, author: string): void => {
            if (!deletekey) return
            api.unFavoriteMessage(deletekey, author).then(() => {
                api.fetchMessageWithAuthor(association?.payload.body.messageId, association?.author ?? '').then((m) => {
                    setMessage(m)
                })
            })
        },
        [association, message]
    )

    if (fetching) return <MessageSkeleton />
    if (!association) return null

    switch (association.schema) {
        case Schemas.like:
            return (
                <>
                    <ListItem
                        sx={{
                            alignItems: 'flex-start',
                            wordBreak: 'break-word'
                        }}
                        disablePadding
                    >
                        <ListItemButton
                            disableGutters
                            component={routerLink}
                            to={`/message/${message?.id ?? ''}@${message?.author ?? ''}`}
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                flex: 1,
                                gap: 2
                            }}
                        >
                            <IconButton
                                sx={{
                                    width: { xs: '38px', sm: '48px' },
                                    height: { xs: '38px', sm: '48px' },
                                    mt: { xs: '3px', sm: '5px' }
                                }}
                                component={routerLink}
                                to={'/entity/' + association.author}
                            >
                                <CCAvatar
                                    alt={author?.payload.body.username}
                                    avatarURL={author?.payload.body.avatar}
                                    identiconSource={isMeToOther ? association?.author : message?.author ?? ''}
                                    sx={{
                                        width: { xs: '38px', sm: '48px' },
                                        height: { xs: '38px', sm: '48px' }
                                    }}
                                />
                            </IconButton>
                            <Box
                                sx={{
                                    flex: 1,
                                    flexDirection: 'column',
                                    width: '100%',
                                    overflow: 'auto',
                                    alignItems: 'flex-start'
                                }}
                            >
                                <Typography>
                                    {isMeToOther ? (
                                        <>
                                            <b>{author?.payload.body.username ?? 'anonymous'}</b> favorited your message
                                        </>
                                    ) : (
                                        <>
                                            You favorited <b>{author?.payload.body.username ?? 'anonymous'}</b>&apos;s
                                            message
                                        </>
                                    )}
                                </Typography>
                                <blockquote style={{ margin: 0, paddingLeft: '1rem', borderLeft: '4px solid #ccc' }}>
                                    {message?.payload.body.body}
                                </blockquote>
                            </Box>
                        </ListItemButton>
                    </ListItem>
                    {props.after}
                </>
            )
        case Schemas.emojiAssociation:
            return (
                <>
                    <ListItem
                        sx={{
                            alignItems: 'flex-start',
                            wordBreak: 'break-word'
                        }}
                        disablePadding
                    >
                        <ListItemButton
                            disableGutters
                            component={routerLink}
                            to={`/message/${message?.id ?? ''}@${message?.author ?? ''}`}
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                flex: 1,
                                gap: 2
                            }}
                        >
                            <IconButton
                                sx={{
                                    width: { xs: '38px', sm: '48px' },
                                    height: { xs: '38px', sm: '48px' },
                                    mt: { xs: '3px', sm: '5px' }
                                }}
                                component={routerLink}
                                to={'/entity/' + association.author}
                            >
                                <CCAvatar
                                    alt={author?.payload.body.username}
                                    avatarURL={author?.payload.body.avatar}
                                    identiconSource={isMeToOther ? association?.author : message?.author ?? ''}
                                    sx={{
                                        width: { xs: '38px', sm: '48px' },
                                        height: { xs: '38px', sm: '48px' }
                                    }}
                                />
                            </IconButton>
                            <Box
                                sx={{
                                    flex: 1,
                                    flexDirection: 'column',
                                    width: '100%',
                                    overflow: 'auto',
                                    alignItems: 'flex-start'
                                }}
                            >
                                <Typography>
                                    {isMeToOther ? (
                                        <>
                                            <b>{author?.payload.body.username ?? 'anonymous'}</b> reacted your message
                                            with{' '}
                                            <img
                                                height="13px"
                                                src={association?.payload.body.imageUrl}
                                                alt={association?.payload.body.shortcode}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            You reacted <b>{author?.payload.body.username ?? 'anonymous'}</b>&apos;s
                                            message with{' '}
                                            <img
                                                height="13px"
                                                src={association?.payload.body.imageUrl}
                                                alt={association?.payload.body.shortcode}
                                            />
                                        </>
                                    )}
                                </Typography>
                                <blockquote style={{ margin: 0, paddingLeft: '1rem', borderLeft: '4px solid #ccc' }}>
                                    {message?.payload.body.body}
                                </blockquote>
                            </Box>
                        </ListItemButton>
                    </ListItem>
                    {props.after}
                </>
            )
        case Schemas.replyAssociation:
            return (
                <>
                    {replyMessage && (
                        <MessageFrame
                            message={replyMessage}
                            lastUpdated={1}
                            variant="oneline"
                            reloadMessage={() => {
                                /* TODO */
                            }}
                        ></MessageFrame>
                    )}
                    {message && (
                        <MessageView
                            message={message}
                            author={author}
                            reactUsers={reactUsers}
                            emojiUsers={emojiUsers}
                            addMessageReaction={async (emoji) => {
                                await api.addMessageReaction(message.id, message.author, emoji.shortcodes, emoji.src)
                            }}
                            theme={theme}
                            hasOwnReaction={hasOwnReaction}
                            msgstreams={[]}
                            messageAnchor={messageAnchor}
                            emojiPickerAnchor={emojiPickerAnchor}
                            api={api}
                            inspectHandler={() => {
                                inspector.inspectItem({ messageId: message.id, author: message.author })
                            }}
                            handleReply={async () => {
                                messageDetail.openAction('reply', message?.id || '', message?.author || '')
                            }}
                            handleReRoute={async () => {
                                messageDetail.openAction('reroute', message?.id || '', message?.author)
                            }}
                            unfavorite={() => {
                                unfavorite(
                                    message.associations.find((e) => e.author === api.userAddress)?.id,
                                    message.author
                                )
                            }}
                            favorite={() => favorite({ ...message })}
                            setMessageAnchor={setMessageAnchor}
                            setEmojiPickerAnchor={setEmojiPickerAnchor}
                            removeMessageReaction={async (id) => {
                                api.unFavoriteMessage(id, message.author)
                            }}
                            deleteMessage={(_id) => {}}
                        />
                    )}
                    {props.after}
                </>
            )
        case Schemas.reRouteAssociation:
            if (!reRouteMessage) {
                return (
                    <ListItem sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Typography variant="caption" color="text.disabled">
                            ReRouted message not found
                        </Typography>
                    </ListItem>
                )
            }
            return (
                <>
                    <ReRouteMessageFrame
                        message={reRouteMessage}
                        lastUpdated={0}
                        reloadMessage={() => {
                            /* TODO */
                        }}
                    />
                    {props.after}
                </>
            )
        default:
            return (
                <>
                    <ListItem sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Typography variant="caption" color="text.disabled">
                            Unknown association schema
                        </Typography>
                    </ListItem>
                    {props.after}
                </>
            )
    }
})

AssociationFrame.displayName = 'AssociationFrame'
