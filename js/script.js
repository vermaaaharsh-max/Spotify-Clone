console.log('Lets write JavaScript');
let currentSong = new Audio();
let songs = [];
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

function getLastSegment(rawPath) {
    const decoded = decodeURIComponent(rawPath.split("?")[0].split("#")[0]);
    const parts = decoded.split(/[/\\]/).filter(Boolean);
    return parts.pop() || "";
}

async function getSongs(folder) {
    currFolder = folder.replace(/^\/+|\/+$/g, "");
    let res = await fetch(`/${currFolder}/`);
    let response = await res.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];

    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        let href = element.getAttribute("href") || "";
        if (href.toLowerCase().endsWith(".mp3")) {
            let fileName = getLastSegment(href).trim();
            if (fileName && !songs.includes(fileName)) {
                songs.push(fileName);
            }
        }
    }

    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML += `<li>
            <img class="invert" width="34" src="img/music.svg" alt="">
            <div class="info">
                <div>${song}</div>
                <div>Harry</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="img/play.svg" alt="">
            </div>
        </li>`;
    }

    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
        });
    });

    return songs;
}

const playMusic = (track, pause = false) => {
    if (!track) return;
    currentSong.src = `/${currFolder}/${encodeURIComponent(track)}`;
    if (!pause) {
        currentSong.play().catch(err => console.error("Playback failed:", err));
        play.src = "img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = track;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
    console.log("displaying albums");
    let res = await fetch(`/songs/`);
    let response = await res.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    let seenFolders = new Set();

    for (let index = 0; index < anchors.length; index++) {
        const e = anchors[index];
        let href = e.getAttribute("href") || "";
        if (!href || href === "../" || href === "./" || href.includes(".htaccess")) continue;

        let folder = getLastSegment(href);
        if (!folder || folder.toLowerCase() === "songs" || folder === ".." || seenFolders.has(folder)) {
            continue;
        }
        seenFolders.add(folder);

        try {
            let infoRes = await fetch(`/songs/${encodeURIComponent(folder)}/info.json`);
            if (!infoRes.ok) continue;
            let info = await infoRes.json();

            cardContainer.innerHTML += `
            <div data-folder="${folder}" class="card">
                <div class="play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                            stroke-linejoin="round" />
                    </svg>
                </div>
                <img src="/songs/${encodeURIComponent(folder)}/cover.jpg" alt="">
                <h2>${info.title}</h2>
                <p>${info.description}</p>
            </div>`;
        } catch (err) {
            console.warn(`Skipping folder "${folder}":`, err);
        }
    }

    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            console.log("Fetching Songs");
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            if (songs.length > 0) {
                playMusic(songs[0]);
            }
        });
    });
}

async function main() {
    await getSongs("songs/Uplifting_(mood)");
    if (songs.length > 0) {
        playMusic(songs[0], true);
    }

    await displayAlbums();

    play.addEventListener("click", () => {
        if (!currentSong.src) return;
        if (currentSong.paused) {
            currentSong.play().catch(err => console.error("Playback failed:", err));
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        if (!isNaN(currentSong.duration) && currentSong.duration > 0) {
            document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        if (isNaN(currentSong.duration) || currentSong.duration <= 0) return;
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    previous.addEventListener("click", () => {
        currentSong.pause();
        let currentTrack = getLastSegment(currentSong.src);
        let index = songs.indexOf(currentTrack);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    next.addEventListener("click", () => {
        currentSong.pause();
        let currentTrack = getLastSegment(currentSong.src);
        let index = songs.indexOf(currentTrack);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg");
        }
    });

    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    });
}

main();