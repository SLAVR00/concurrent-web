import { useState, useEffect, useCallback, memo, useContext } from 'react'
import {
    ListItem,
    Box,
    Typography,
    Link,
    IconButton,
    useTheme,
    Tooltip,
    Skeleton
} from '@mui/material'
import StarIcon from '@mui/icons-material/Star'
import StarOutlineIcon from '@mui/icons-material/StarOutline'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'

import type {
    Character,
    Message,
    ProfileWithAddress,
    StreamElementDated
} from '../model'
import type { Profile } from '../schemas/profile'
import { Schemas } from '../schemas'
import { MarkdownRenderer } from './MarkdownRenderer'
import { CCAvatar } from './CCAvatar'
import { TimeDiff } from './TimeDiff'
import type { Like } from '../schemas/like'
import { useApi } from '../context/api'

export interface TimelineMessageappData {
    message: StreamElementDated
    follow: (ccaddress: string) => void
    setInspectItem: (message: Message<any>) => void
}

export const TimelineMessage = memo<TimelineMessageappData>(
    (props: TimelineMessageappData): JSX.Element => {
        const api = useApi()
        const [author, setAuthor] = useState<Character<Profile> | undefined>()
        const [message, setMessage] = useState<Message<any> | undefined>()
        const [msgstreams, setStreams] = useState<string[]>([])
        const [reactUsers, setReactUsers] = useState<ProfileWithAddress[]>([])

        const theme = useTheme()

        const [hasOwnReaction, setHasOwnReaction] = useState<boolean>(false)

        useEffect(() => {
            api.fetchMessage(props.message.id, props.message.currenthost)
                .then((msg) => {
                    if (!msg) return
                    setMessage(msg)
                    Promise.all(
                        msg.streams.map(
                            async (id) =>
                                await api
                                    .readStream(id)
                                    .then((e) => e?.payload.body.name)
                        )
                    ).then((e) => {
                        setStreams(e.filter((x) => x))
                    })
                })
                .catch((error) => {
                    console.error(error)
                })

            api.readCharacter(props.message.author, Schemas.profile)
                .then((author) => {
                    setAuthor(author)
                })
                .catch((error) => {
                    console.error(error)
                })
        }, [props.message, props.message.LastUpdated])

        useEffect(() => {
            const fetchUsers = async (): Promise<any> => {
                const authors =
                    message?.associations
                        .filter((e) => e.schema === Schemas.like)
                        .map((m) => m.author) ?? []

                if (
                    message?.associations.find(
                        (e) => e.author === api.userAddress
                    ) != null
                ) {
                    setHasOwnReaction(true)
                } else {
                    setHasOwnReaction(false)
                }
                const users = await Promise.all(
                    authors.map((ccaddress) =>
                        api
                            .readCharacter(ccaddress, Schemas.profile)
                            .then((e) => {
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
        }, [message?.associations])

        const favorite = useCallback(async (): Promise<void> => {
            const targetStream = [
                (await api.readCharacter(props.message.author, Schemas.profile))
                    ?.payload.body.notificationStream
            ].filter((e) => e) as string[]

            api.createAssociation<Like>(
                Schemas.like,
                {},
                props.message.id,
                'messages',
                targetStream
            ).then((_) => {
                api.invalidateMessage(props.message.id)
            })
        }, [])

        const unfavorite = useCallback(
            (deletekey: string | undefined): void => {
                if (!deletekey) return
                api.deleteAssociation(deletekey).then((_) => {
                    api.invalidateMessage(props.message.id)
                })
            },
            []
        )

        if (!message?.payload?.body) {
            return (
                <ListItem
                    sx={{
                        alignItems: 'flex-start',
                        flex: 1,
                        p: { xs: '7px 0', sm: '10px 0' },
                        height: 105,
                        gap: '10px'
                    }}
                >
                    <Skeleton
                        animation="wave"
                        variant="circular"
                        width={40}
                        height={40}
                    />
                    <Box sx={{ flex: 1 }}>
                        <Skeleton animation="wave" />
                        <Skeleton animation="wave" height={80} />
                    </Box>
                </ListItem>
            )
        }

        return (
            <ListItem
                sx={{
                    alignItems: 'flex-start',
                    flex: 1,
                    p: { xs: '7px 0', sm: '10px 0' },
                    wordBreak: 'break-word'
                }}
            >
                {message?.payload?.body && (
                    <>
                        <Box
                            sx={{
                                padding: {
                                    xs: '5px 8px 0 0',
                                    sm: '8px 10px 0 0'
                                }
                            }}
                        >
                            <IconButton
                                onClick={() => {
                                    props.follow(message.author)
                                }}
                                sx={{
                                    width: { xs: '38px', sm: '48px' },
                                    height: { xs: '38px', sm: '48px' }
                                }}
                            >
                                <CCAvatar
                                    alt={author?.payload.body.username}
                                    avatarURL={author?.payload.body.avatar}
                                    identiconSource={message.author}
                                    sx={{
                                        width: { xs: '38px', sm: '48px' },
                                        height: { xs: '38px', sm: '48px' }
                                    }}
                                />
                            </IconButton>
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                flex: 1,
                                flexDirection: 'column',
                                width: '100%',
                                overflow: 'auto'
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        gap: '5px'
                                    }}
                                >
                                    <Typography
                                        component="span"
                                        sx={{
                                            fontWeight: '700',
                                            fontSize: {
                                                xs: '0.9rem',
                                                sm: '1rem'
                                            }
                                        }}
                                    >
                                        {author?.payload.body.username ??
                                            'anonymous'}
                                    </Typography>
                                    <Typography
                                        component="span"
                                        sx={{
                                            fontweight: '400',
                                            fontSize: '10px',
                                            display: {
                                                xs: 'none',
                                                sm: 'inline'
                                            }
                                        }}
                                    >
                                        {message.author}
                                    </Typography>
                                </Box>
                                <Link
                                    component="button"
                                    underline="hover"
                                    color="inherit"
                                >
                                    <TimeDiff date={new Date(message.cdate)} />
                                </Link>
                            </Box>
                            <MarkdownRenderer
                                messagebody={message.payload.body.body}
                            />
                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: '10px',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <Box sx={{ display: 'flex' }}>
                                    {/* left */}
                                    <Tooltip
                                        title={
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 1
                                                }}
                                            >
                                                {reactUsers.map((user) => (
                                                    <Box
                                                        key={user.ccaddress}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                            gap: 1
                                                        }}
                                                    >
                                                        <CCAvatar
                                                            sx={{
                                                                height: '20px',
                                                                width: '20px'
                                                            }}
                                                            avatarURL={
                                                                user.avatar
                                                            }
                                                            identiconSource={
                                                                user.ccaddress
                                                            }
                                                            alt={user.ccaddress}
                                                        />
                                                        {user.username ??
                                                            'anonymous'}
                                                    </Box>
                                                ))}
                                            </Box>
                                        }
                                        placement="top"
                                        disableHoverListener={
                                            reactUsers.length === 0
                                        }
                                    >
                                        <Box sx={{ display: 'flex' }}>
                                            <IconButton
                                                sx={{
                                                    p: '0',
                                                    color: theme.palette.text
                                                        .secondary
                                                }}
                                                color="primary"
                                                onClick={() => {
                                                    if (hasOwnReaction) {
                                                        unfavorite(
                                                            message.associations.find(
                                                                (e) =>
                                                                    e.author ===
                                                                    api.userAddress
                                                            )?.id
                                                        )
                                                    } else {
                                                        favorite()
                                                    }
                                                }}
                                            >
                                                {hasOwnReaction ? (
                                                    <StarIcon />
                                                ) : (
                                                    <StarOutlineIcon />
                                                )}
                                            </IconButton>
                                            <Typography sx={{ size: '16px' }}>
                                                {
                                                    message.associations.filter(
                                                        (e) =>
                                                            e.schema ===
                                                            Schemas.like
                                                    ).length
                                                }
                                            </Typography>
                                        </Box>
                                    </Tooltip>
                                    <IconButton
                                        onClick={() => {
                                            props.setInspectItem(
                                                message ?? null
                                            )
                                        }}
                                        sx={{
                                            p: '0',
                                            color: theme.palette.text.secondary
                                        }}
                                    >
                                        <MoreHorizIcon />
                                    </IconButton>
                                </Box>
                                <Box>
                                    {/* right */}
                                    <Typography
                                        component="span"
                                        sx={{
                                            fontweight: '400',
                                            fontSize: '13px',
                                            color: 'text.secondary'
                                        }}
                                    >
                                        {msgstreams
                                            .map(
                                                (e) =>
                                                    `%${
                                                        e.length < 12
                                                            ? e
                                                            : e.slice(0, 9) +
                                                              '...'
                                                    }`
                                            )
                                            .join(' ')}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </>
                )}
            </ListItem>
        )
    }
)

TimelineMessage.displayName = 'TimelineMessage'
