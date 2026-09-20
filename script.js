// Trích xuất Video ID chuẩn xác (bất chấp tham số rác đằng sau)
function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Trích xuất Playlist ID
function extractPlaylistId(url) {
    const regExp = /[?&]list=([^#\&\?]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

document.getElementById('fetchBtn').addEventListener('click', async function () {
    const url = document.getElementById('urlInput').value.trim();
    const errorContainer = document.getElementById('errorContainer');

    errorContainer.classList.add('hidden');
    document.getElementById('resultContainer').classList.add('hidden');

    if (!url) {
        showError('Vui lòng nhập đường dẫn YouTube!');
        return;
    }

    // Hiển thị loader
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('loader').classList.remove('hidden');
    document.getElementById('loader').classList.add('flex');

    try {
        const videoId = extractYouTubeId(url);
        const playlistId = extractPlaylistId(url);
        
        if (!videoId && !playlistId) {
            throw new Error('Không tìm thấy Video ID hoặc Playlist ID hợp lệ trong đường dẫn.');
        }

        // Bật/tắt trạng thái checkbox Playlist dựa trên việc link có ID playlist hay không
        const toggle = document.getElementById('playlistToggle');
        if (playlistId) {
            toggle.disabled = false;
            toggle.checked = true; // Auto check nếu phát hiện có list parameter
        } else {
            toggle.checked = false;
            toggle.disabled = true; // Không có list param thì không thể ép tải playlist
        }

        // Ưu tiên hiển thị thông tin video nếu có, nếu không thì hiển thị playlist
        if (videoId) {
            const cleanWatchUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(cleanWatchUrl)}&format=json`;
            const response = await fetch(oembedUrl);

            if (response.ok) {
                const data = await response.json();
                document.getElementById('videoTitle').textContent = data.title;
                document.getElementById('videoChannel').innerHTML = `<i class="fa-solid fa-user-circle text-rose-500 mr-1"></i> ${data.author_name}`;
                document.getElementById('videoThumb').src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            } else {
                // Fallback nếu không lấy được qua oembed (ví dụ video riêng tư, hoặc lỗi mạng)
                document.getElementById('videoTitle').textContent = 'Video YouTube (Không lấy được tên)';
                document.getElementById('videoChannel').innerHTML = `<i class="fa-solid fa-user-circle text-rose-500 mr-1"></i> Không rõ`;
                document.getElementById('videoThumb').src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }
        } else if (playlistId) {
            document.getElementById('videoTitle').textContent = `Danh sách phát: ${playlistId}`;
            document.getElementById('videoChannel').innerHTML = `<i class="fa-solid fa-list text-rose-500 mr-1"></i> Playlist YouTube`;
            // Thumbnail mặc định cho playlist khi không có API key
            document.getElementById('videoThumb').src = 'https://placehold.co/600x400/1e293b/475569?text=Playlist';
        }

        document.getElementById('loader').classList.remove('flex');
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('resultContainer').classList.remove('hidden');

    } catch (err) {
        document.getElementById('loader').classList.remove('flex');
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('emptyState').classList.remove('hidden');
        showError(err.message || 'Không lấy được thông tin. Hãy chắc chắn link công khai và chính xác.');
    }
});

function showError(msg) {
    document.getElementById('errorText').textContent = msg;
    document.getElementById('errorContainer').classList.remove('hidden');
}

// Hàm chuyển hướng sang trang ytdlp.online với lệnh được kết hợp giữa tham số playlist và format
function downloadMedia(format) {
    const url = document.getElementById('urlInput').value.trim();
    if (!url) {
        showError('Vui lòng nhập đường dẫn YouTube!');
        return;
    }

    // Đọc trạng thái checkbox ép tải playlist
    const isPlaylist = document.getElementById('playlistToggle').checked;
    const playlistArg = isPlaylist ? '--yes-playlist ' : '--no-playlist ';

    let formatArg = '';
    switch (format) {
        case 'best':
            formatArg = ''; // Mặc định yt-dlp tải best
            break;
        case '1080p':
            formatArg = '-f "bestvideo[height<=1080]+bestaudio/best" ';
            break;
        case '720p':
            formatArg = '-f "bestvideo[height<=720]+bestaudio/best" ';
            break;
        case '480p':
            formatArg = '-f "bestvideo[height<=480]+bestaudio/best" ';
            break;
        case 'mp3':
            formatArg = '-x --audio-format mp3 ';
            break;
        default:
            formatArg = '';
    }

    // Kết hợp tạo lệnh yt-dlp hoàn chỉnh
    const command = `yt-dlp ${playlistArg}${formatArg}"${url}"`.replace(/\s+/g, ' ');

    // ytdlp.online dùng ?url= nhưng chấp nhận toàn bộ lệnh yt-dlp (kể cả flags)
    // Ví dụ: ?url=yt-dlp -x --audio-format mp3 "https://..."
    const targetUrl = 'https://ytdlp.online/?url=' + encodeURIComponent(command);

    // Copy lệnh vào clipboard (backup) và chuyển hướng
    navigator.clipboard.writeText(command).then(() => {
        window.open(targetUrl, '_blank');
    }).catch(() => {
        window.open(targetUrl, '_blank');
    });
}

// Tự động kiểm tra với link mặc định khi tải trang
window.onload = function () {
    document.getElementById('fetchBtn').click();
};
