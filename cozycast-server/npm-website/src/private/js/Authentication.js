export const TokenStatus = {
    EXPIRED: "EXPIRED",
    NO_TOKEN: "NO_TOKEN",
    VALID: "VALID"
}

let refresh_token = localStorage.getItem("refreshToken");
let access_token = JSON.parse(localStorage.getItem("accessToken"));

export async function authFetch(path, body = {}){
    let resp = await updateAccessToken();
    if(resp != TokenStatus.VALID){
        return resp;
    }

    let authBody = body;
    authBody["headers"] = {...body["headers"],Authorization: "Bearer " + access_token.token}
    let response = await fetch(path,authBody);
    return response;
}

export async function getToken(){
    let resp = await updateAccessToken();
    if(resp != TokenStatus.VALID){
        return resp;
    }
    return access_token.token
}

export async function authLogin(username, password){
    let response = await fetch('/login', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    });

    return await authParse(response);
}

export function logOut(){
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("accessToken");
    access_token = null;
    refresh_token = null;
}

async function updateAccessToken(){
    if(access_token != null && (access_token.expires + 60 > Math.ceil(new Date().getTime()/1000))){
        return TokenStatus.VALID;
    } else if(refresh_token != null){
        if(await authRefresh()){
            return TokenStatus.VALID;
        } else {
            logOut();
            return TokenStatus.EXPIRED;
        }
    } else {
        return TokenStatus.NO_TOKEN
    }
}

async function authRefresh(){
    let response = await fetch('/oauth/access_token', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            grant_type: "refresh_token",
            refresh_token: refresh_token
        })
    })

    return await authParse(response);
}

async function authParse(response){
    if( response.status != 200)
        return false;

    let a = await response.json();

    if(a && a.access_token) {
        localStorage.setItem("refreshToken", a.refresh_token);
        access_token = {token: a.access_token, expires: a.expires_in + Math.ceil(new Date().getTime()/1000)};
        localStorage.setItem("accessToken", JSON.stringify(access_token));

        return true;
    }

    return false;
}
