import axios from "axios"
import {JSDOM} from 'jsdom'
import {writeFileSync} from 'node:fs'

async function main() {
    const clanIds = [527406, 1374400, 537048];
    for (const clanId of clanIds) {
        const clanMembers = await getClanMembers(clanId);
        const clanCsv = await getClanCsv(clanId, clanMembers);
        writeFileSync(`${clanId}.txt`, clanCsv)
    }
    debugger;
}

async function getClanCsv(clanId, clanMembers) {
    let str = "";
    let i = 0
    for (const member of clanMembers) {
        const memberData = await getUserStats(member);
        console.log(`Clan ${clanId} progress: ${++i}/${clanMembers.length}`)
        str += `${getUserCsv(memberData)}\n`
        await new Promise(resolve => setTimeout(resolve, 500))
    }
    return str;
}

function getUserCsv(userData) {
    let str = ""
    str += `${userData.username},`
    str += `${userData.profile_url},`
    str += `${userData.ranked.rating} / ${userData.ranked.peak_rating},`
    str += userData.ranked2v2.length > 0 ? `${userData.ranked2v2[0].rating} / ${userData.ranked2v2[0].peak_rating}` : "0 / 0"

    return str
}

async function getClanMembers(clanId) {
    const page = await fetchUrl(`https://corehalla.com/stats/clan/${clanId}`);
    const dom = new JSDOM(page.data);
    const data = JSON.parse(dom.window.document.querySelector("#__NEXT_DATA__").innerHTML).props.pageProps.trpcState.queries;

    return data[2].state.data.clan.map(el => el.brawlhalla_id);
}

async function fetchUrl(url) {
    return await axios.get(url).catch(async () => await fetchUrl(url))
}

async function getUserStats(user) {
    const page = await fetchUrl(`https://corehalla.com/stats/player/${user}`)

    const dom = new JSDOM(page.data)

    const data = JSON.parse(dom.window.document.querySelector("#__NEXT_DATA__").innerHTML).props.pageProps.trpcState.queries
    const overview = data[3].state.data
    return {
        username: data[2].state.data.name,
        profile_url: `https://corehalla.com/stats/player/${user}`,
        ranked: {
            rating: overview.rating,
            peak_rating: overview.peak_rating
        },
        ranked2v2: overview["2v2"] ? overview["2v2"].sort((el1, el2) => el2.peak_rating - el1.peak_rating) : undefined
    }
}

main()