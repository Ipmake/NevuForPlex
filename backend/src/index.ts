import axios, { AxiosRequestConfig } from 'axios';
import express from 'express';
import https from 'https';
import { Server as SocketIOServer } from 'socket.io';
import { PerPlexed } from './types';
import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { CheckPlexUser } from './common/plex';
import fs from 'fs';
import { Discovery } from 'udp-discovery';
import httpProxy from 'http-proxy';

/* 
 * ENVIRONMENT VARIABLES
    * 
    * PORT: The port you published the docker container to, defaults to 3000 (For discovery)
    * LISTEN_PORT: The port the server will listen on, defaults to 3000
    * PLEX_SERVER: The URL of the Plex server that the frontend will connect to
    * DISABLE_TLS_VERIFY?: If set to true, the proxy will not check any https ssl certificates
    * DISABLE_NEVU_SYNC?: If set to true, NEVU sync (watch together) will be disabled
    * DISABLE_REQUEST_LOGGING?: If set to true, the server will not log any requests
    * DISABLE_GLOBAL_REVIEWS?: If set to true, nevu community reviews will be disabled
**/
const deploymentID = randomBytes(8).toString('hex');

const nevuHubUrl = "https://gnuqknwmixeunfmeseep.supabase.co/functions/v1/"

const status: PerPlexed.Status = {
    ready: false,
    error: false,
    message: 'Server is starting up...',
}

const app = express();
const prisma = new PrismaClient();
const discovery = new Discovery();

console.log(`Deployment ID: ${deploymentID}`);

discovery.announce("Nevu", {
    port: parseInt(process.env.PORT || '3000'),
    type: 'nevu',
    protocol: 'tcp',
    txt: {
        deploymentID,
        version: '1.0.0',
        plexServer: process.env.PLEX_SERVER,
    }
}, 500, true);

const proxy = httpProxy.createProxyServer({
    ws: true,
    autoRewrite: false,
    cookieDomainRewrite: (new URL(process.env.PLEX_SERVER as string)).hostname,
    changeOrigin: true,
    secure: false,
});

proxy.on('error', (err, req, res) => {
    console.error('Proxy error:', err);
});

app.use(express.json());

const noVerifyHttpsAgent = new https.Agent({
    rejectUnauthorized: false
});

(async () => {
    const packageJson = fs.readFileSync('package.json', 'utf-8');
    const packageJsonParsed = JSON.parse(packageJson);

    if (packageJsonParsed.version !== "1.0.0") {
        status.error = true;
        status.message = 'PerPlexed is now NEVU! \nPlease change the docker image from "ipmake/perplexed" to "ipmake/nevu"';
        console.error('PerPlexed is now NEVU! \nPlease change the docker image from "ipmake/perplexed" to "ipmake/nevu"');
        return
    }

    if (process.env.PROXY_PLEX_SERVER) {
        status.error = true;
        status.message = 'PROXY_PLEX_SERVER environment variable is deprecated. \nPlease use PLEX_SERVER instead';
        console.error('PROXY_PLEX_SERVER environment variable is deprecated. \nPlease use PLEX_SERVER instead');
        return;
    }

    if (process.env.DISABLE_PROXY) {
        status.error = true;
        status.message = 'DISABLE_PROXY environment variable is deprecated. \nPlease remove it from your environment variables';
        console.error('DISABLE_PROXY environment variable is deprecated. \nPlease remove it from your environment variables');
        return;
    }

    if (!process.env.PLEX_SERVER) {
        status.error = true;
        status.message = 'PLEX_SERVER environment variable not set';
        console.error('PLEX_SERVER environment variable not set');
        return;
    }

    if (process.env.PLEX_SERVER) {
        // check if the PLEX_SERVER environment variable is a valid URL, the URL must not end with a /
        if (!process.env.PLEX_SERVER.match(/^https?:\/\/[^\/]+$/)) {
            status.error = true;
            status.message = 'Invalid PLEX_SERVER environment variable. \nThe URL must start with http:// or https:// and must not end with a /';
            console.error('Invalid PLEX_SERVER environment variable. \nThe URL must start with http:// or https:// and must not end with a /');
            return;
        }

        // check whether the PLEX_SERVER is reachable
        try {
            await axios.get(`${process.env.PLEX_SERVER}/identity`, {
                timeout: 5000,
            });
        } catch (error) {
            status.error = true;
            status.message = 'Proxy cannot reach PLEX_SERVER';
            console.error('Proxy cannot reach PLEX_SERVER');
            return;
        }
    }


    // if(!status.error) {
    //     let checkAllows = false;
    //     const fetchStatus = async () => {
    //         try {
    //             const res = await axios.get(`${process.env.PLEX_SERVER}/`, {
    //                 timeout: 2500,
    //             });

    //             const m = res.data.MediaContainer;

    //             if(
    //                 !m.transcoderAudio ||
    //                 !m.transcoderSubtitles ||
    //                 !m.transcoderVideo
    //             ) {
    //                 status.error = true;
    //                 status.message = `PLEX_SERVER ${m.friendlyName} does not allow transcoding`;
    //                 console.error(`PLEX_SERVER ${m.friendlyName} does not allow transcoding`);
    //                 return;
    //             }

    //             checkAllows = true;
    //             status.error = false;

    //         } catch (error: any) {
    //             status.error = true;
    //             status.message = 'Server cannot reach PLEX_SERVER' + error.message;
    //             console.error('Server cannot reach PLEX_SERVER ' + error.message);
    //         }
    //     }

    //     await new Promise<void>((resolve) => {
    //         setTimeout(() => {
    //             if(checkAllows) return resolve();
    //             fetchStatus();
    //         }, 5000);
    //     })
    // }


    if (status.error) return;
    status.ready = true;
    status.message = 'OK';
})();

app.use((req, res, next) => {
    if (process.env.DISABLE_REQUEST_LOGGING != "true") console.log(`[${new Date().toISOString()}] [${req.method}] ${req.url}`);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', '*'); // Add this line
    next();
});

app.get('/status', (req, res) => {
    res.send(status);
});

app.get('/config', (req, res) => {
    res.send({
        PLEX_SERVER: process.env.PLEX_SERVER,
        DEPLOYMENTID: deploymentID,
        CONFIG: {
            DISABLE_PROXY: process.env.DISABLE_PROXY === 'true',
            DISABLE_NEVU_SYNC: process.env.DISABLE_NEVU_SYNC === 'true',
        }
    });
});

app.get('/user/options', async (req, res) => {
    if (!req.headers['x-plex-token']) return res.status(401).send('Unauthorized');

    const user = await CheckPlexUser(req.headers['x-plex-token'] as string);
    if (!user) return res.status(401).send('Unauthorized user');

    const options = await prisma.userOption.findMany({
        where: {
            userUid: user.uuid,
        }
    }).catch((err) => {
        res.status(500).send('Internal server error');
        console.log(err);
        return null;
    });
    if (!options) return;

    res.send(options);
});

app.get('/user/options/:key', async (req, res) => {
    if (!req.headers['x-plex-token']) return res.status(401).send('Unauthorized');

    const user = await CheckPlexUser(req.headers['x-plex-token'] as string);
    if (!user) return res.status(401).send('Unauthorized user');

    const { key } = req.params;
    if (!key) return res.status(400).send('Bad request');

    const option = await prisma.userOption.findFirst({
        where: {
            userUid: user.uuid,
            key,
        }
    }).catch((err) => {
        res.status(500).send('Internal server error');
        console.log(err);
        return null;
    });
    if (!option) return res.status(404).send('Option not found');
    res.send(option);
});


app.post('/user/options', async (req, res) => {
    if (!req.headers['x-plex-token']) return res.status(401).send('Unauthorized');

    const user = await CheckPlexUser(req.headers['x-plex-token'] as string);
    if (!user) return res.status(401).send('Unauthorized user');

    const { key, value } = req.body;

    if (!key || !value) return res.status(400).send('Bad request');

    const option = await prisma.userOption.upsert({
        where: {
            userUid_key: {
                userUid: user.uuid,
                key,
            }
        },
        update: {
            value,
        },
        create: {
            userUid: user.uuid,
            key,
            value,
        }
    }).catch((err) => {
        res.status(500).send('Internal server error');
        console.log(err);
        return null;
    });
    if (!option) return;

    res.send(option);
});

app.get('/reviews', async (req, res) => {
    const { itemID, userID } = req.query;
    const plexToken = req.headers['x-plex-token'];

    if (!plexToken) return res.status(401).send('Unauthorized');
    const user = await CheckPlexUser(plexToken as string);
    if (!user) return res.status(401).send('Unauthorized user');

    if (!itemID || typeof itemID !== 'string' || !itemID.startsWith("plex://")) return res.status(400).send({
        error: "Invalid itemID",
    });
    if (userID && (typeof userID !== 'string')) return res.status(400).send({
        error: "Invalid userID",
    });

    try {
        const reviews = (await prisma.nevuReviewsLocal.findMany({
            where: {
                itemID: itemID as string,
                ...(userID && { userID: userID as string }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    }
                },
            },
            orderBy: {
                created_at: 'desc',
            }
        })).map((review) => ({
            ...review,
            visibility: "LOCAL", // Set visibility to NEVU for local reviews
        }))

        if (process.env.DISABLE_GLOBAL_REVIEWS !== 'true') {
            const globalReviews = await axios.post(`${nevuHubUrl}review-get`, {
                itemID: itemID as string,
                ...(userID && { userID: userID as string }),
            }, {
                headers: {
                    'x-plex-token': plexToken as string,
                }
            });

            reviews.push(...globalReviews.data.data.map((review: any) => ({
                ...review,
                visibility: "GLOBAL", // Set visibility to GLOBAL for NevuHUB reviews
            })));
        }

        reviews.sort((a, b) => {
            const aDate = new Date(a.created_at).getTime();
            const bDate = new Date(b.created_at).getTime();
            return bDate - aDate; // Sort by most recent first
        })

        res.send(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

app.post('/reviews', async (req, res) => {
    const { itemID, message, rating, spoilers, visibility } = req.body;
    const plexToken = req.headers['x-plex-token'];

    if (!plexToken) return res.status(401).send('Unauthorized');
    const user = await CheckPlexUser(plexToken as string);
    if (!user) return res.status(401).send('Unauthorized user');

    if (!itemID || typeof itemID !== 'string' || !itemID.startsWith("plex://")) return res.status(400).send({
        error: "Invalid itemID",
    });
    if (!message || typeof message !== 'string' || message.trim().length === 0 || message.length > 256) return res.status(400).send({
        error: "Invalid message",
    });
    if (rating && (typeof rating !== 'number' || rating < 0 || rating > 10)) return res.status(400).send({
        error: "Invalid rating",
    });
    if (!visibility || !["GLOBAL", "LOCAL"].includes(visibility)) return res.status(400).send({
        error: "Invalid visibility",
    });

    if (visibility === "GLOBAL" && process.env.DISABLE_GLOBAL_REVIEWS === 'true') {
        return res.status(403).send({
            error: "Global reviews are disabled",
        });
    }

    let error: string | false = false;

    try {
        switch (visibility) {
            case "GLOBAL":
                const res = await axios.post(`${nevuHubUrl}review-update`, {
                    itemID: itemID as string,
                    userID: user.uuid,
                    message: message.trim(),
                    rating: rating,
                    spoilers: spoilers,
                }, {
                    headers: {
                        'x-plex-token': plexToken as string,
                    }
                }).catch((error: any) => {
                    console.error("Failed to update Nevu review:", error);
                    return error.response || { data: { error: "Failed to update review" } };
                });

                if (res.data.error) error = res.data.error;
                break;
            case "LOCAL":
                await prisma.nevuReviewsLocalUsers.upsert({
                    where: {
                        id: user.uuid,
                    },
                    create: {
                        id: user.uuid,
                        username: user.friendlyName || user.username,
                        avatar: user.thumb || '',
                    },
                    update: {
                        username: user.friendlyName || user.username,
                        avatar: user.thumb || '',
                    },
                })

                await prisma.nevuReviewsLocal.upsert({
                    where: {
                        itemID_userID: {
                            itemID: itemID as string,
                            userID: user.uuid,
                        }
                    },
                    create: {
                        itemID: itemID as string,
                        userID: user.uuid,
                        message: message.trim(),
                        rating: rating ?? null,
                        spoilers: spoilers ?? null,
                    },
                    update: {
                        message: message.trim(),
                        rating: rating ?? null,
                        spoilers: spoilers ?? null,
                    }
                });
                break;
        }

        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Content-Type', 'application/json');

        res.send({
            error,
        });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).send({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
})

app.delete('/reviews', async (req, res) => {
    const { itemID, visibility } = req.query;

    const plexToken = req.headers['x-plex-token'];

    if (!plexToken) return res.status(401).send('Unauthorized');
    const user = await CheckPlexUser(plexToken as string);
    if (!user) return res.status(401).send('Unauthorized user');
    if (!itemID || typeof itemID !== 'string' || !itemID.startsWith("plex://")) return res.status(400).send({
        error: "Invalid itemID",
    });
    if (visibility && !["GLOBAL", "LOCAL"].includes(visibility.toString())) return res.status(400).send({
        error: "Invalid visibility",
    });

    if (visibility === "GLOBAL" && process.env.DISABLE_GLOBAL_REVIEWS === 'true') {
        return res.status(403).send({
            error: "Global reviews are disabled",
        });
    }

    let error: string | false = false;

    try {
        switch (visibility) {
            case "GLOBAL":
                const res = await axios.post(`${nevuHubUrl}review-delete`, {
                    itemID: itemID as string
                }, {
                    headers: {
                        'x-plex-token': plexToken as string,
                    }
                });

                if (res.data.error) return error = res.data.error;
                break;
            case "LOCAL":
                await prisma.nevuReviewsLocal.delete({
                    where: {
                        itemID_userID: {
                            itemID: itemID as string,
                            userID: user.uuid,
                        }
                    }
                });
                break;
        }

        res.send({
            error,
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).send({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
})

app.use('/dynproxy/*', (req, res) => {
    const url = req.originalUrl.split('/dynproxy')[1];
    if (!url) return res.status(400).send('Bad request');

    // strip cookies from the request
    req.headers.cookie = '';
    req.headers['x-forwarded-for'] = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    proxy.web(req, res, { target: `${process.env.PLEX_SERVER}${url}` }, (err) => {
        console.error('Proxy error:', err);
        res.status(500).send('Proxy error');
    });
});

app.post('/proxy', (req, res) => {
    const { url, method, headers, data } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // the url must start with a / to prevent the server from making requests to external servers
    if (!url || !url.startsWith('/')) return res.status(400).send('Invalid URL');

    // check that the url doesn't include any harmful characters that could be used for directory traversal
    if (url.match(/\.\./)) return res.status(400).send('Invalid URL');

    // the method must be one of the allowed methods [GET, POST, PUT]
    if (!method || !['GET', 'POST', 'PUT'].includes(method)) return res.status(400).send('Invalid method');

    const config: AxiosRequestConfig = {
        url: `${process.env.PLEX_SERVER}${url}`,
        method,
        headers: {
            ...headers,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0',
            'X-Fowarded-For': ip,
        },
        data,
        ...(process.env.DISABLE_TLS_VERIFY === "true" && {
            httpsAgent: noVerifyHttpsAgent
        })
    };

    axios(config)
        .then((response) => {
            res.set('Content-Type', response.headers['content-type']);
            res.set('Content-Length', response.headers['content-length']);
            // res.set('Cache-Control', 'public, max-age=31536000');
            res.status(response.status).send(response.data);
        })
        .catch((error) => {
            res.status(error.response?.status || 500).send(error.response?.data || 'Proxy error');
        });
});

app.get('/proxy', async (req, res) => {
    const { url, method, ...params } = req.query;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // the url must start with a / to prevent the server from making requests to external servers
    if (!url || typeof url !== "string" || !url.startsWith('/')) return res.status(400).send('Invalid URL');

    // check that the url doesn't include any harmful characters that could be used for directory traversal
    if (url.match(/\.\./)) return res.status(400).send('Invalid URL');

    // the method must be one of the allowed methods [GET, POST, PUT]
    if (!method || typeof method !== "string" || !['GET', 'POST', 'PUT'].includes(method)) return res.status(400).send('Invalid method');

    // remove url and method from params
    const { url: _, method: __, ...queryParams } = req.query;

    const config: AxiosRequestConfig = {
        url: `${process.env.PLEX_SERVER}${url}`,
        method,
        headers: {
            ...req.headers,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0',
            'X-Fowarded-For': ip,
        },
        params: queryParams,
        ...(process.env.DISABLE_TLS_VERIFY === "true" && {
            httpsAgent: noVerifyHttpsAgent
        }),
        responseType: 'stream'
    };

    axios(config).then((response) => {
        res.set('Content-Type', response.headers['content-type']);
        res.set('Content-Length', response.headers['content-length']);
        // res.set('Cache-Control', 'public, max-age=31536000');
        response.data.pipe(res);
    }).catch((error) => {
        res.status(error.response?.status || 500).send(error.response?.data || 'Proxy error');
    });
});

app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', '*');
    res.send();
});

app.use(express.static('www'));

const server = app.listen(process.env.LISTEN_PORT || 3000, () => {
    console.log(`Server started on http://localhost:${process.env.LISTEN_PORT || 3000}`);
});

let io = (process.env.DISABLE_NEVU_SYNC === 'true') ? null : new SocketIOServer(server, {
    cors: {
        origin: '*',
    },
    connectionStateRecovery: {
        maxDisconnectionDuration: 10000, // 10 seconds
    }
});

let remoteIo = new SocketIOServer(server, {
    cors: {
        origin: '*',
    },
    path: '/nevu-remote',
    connectionStateRecovery: {
        maxDisconnectionDuration: 10000, // 10 seconds
        skipMiddlewares: false, // Skip middlewares for remote connections
    },
});


app.use((req, res, next) => {
    if (req.url.startsWith('/socket.io')) return next();
    res.sendFile('index.html', { root: 'www' });
});

export { app, server, io, remoteIo, deploymentID, prisma };

import './common/sync';
import './common/remote'; import { error } from 'console';

