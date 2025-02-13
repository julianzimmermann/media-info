document.addEventListener('DOMContentLoaded', () => {
    fetch('media_info.json')
        .then(response => response.json())
        .then(data => {
            const content = document.getElementById('content');
            const mediaInfo = displayMediaInfo(data);
            content.appendChild(mediaInfo);

            populateFilterOptions(data);

            document.getElementById('applyFilters').addEventListener('click', () => {
                const videoCodec = document.getElementById('videoCodec').value.toLowerCase();
                const audioCodec = document.getElementById('audioCodec').value.toLowerCase();
                const audioChannels = document.getElementById('audioChannels').value;
                const videoResolution = document.getElementById('videoResolution').value.toLowerCase();
                const filteredData = filterMediaInfo(data, { videoCodec, audioCodec, audioChannels, videoResolution });
                content.innerHTML = '';
                const filteredMediaInfo = displayMediaInfo(filteredData);
                content.appendChild(filteredMediaInfo);
            });
        })
        .catch(error => console.error('Error loading JSON:', error));
});

function displayMediaInfo(data) {
    const fragment = document.createDocumentFragment();
    data.forEach(item => {
        const mediaItem = document.createElement('div');
        mediaItem.classList.add('media-item');

        const title = document.createElement('h2');
        title.textContent = item.path;
        title.addEventListener('click', () => {
            const details = mediaItem.querySelector('.details');
            details.style.display = details.style.display === 'none' ? 'block' : 'none';
        });
        mediaItem.appendChild(title);

        const type = document.createElement('p');
        type.textContent = `Type: ${item.type}`;
        mediaItem.appendChild(type);

        const details = document.createElement('div');
        details.classList.add('details');

        if (item.type === 'video' && item.info) {
            const videoInfo = document.createElement('div');
            videoInfo.innerHTML = `
                <p><strong>Codec:</strong> ${item.info.streams[0].codec_name}</p>
                <p><strong>Resolution:</strong> ${item.info.streams[0].width}x${item.info.streams[0].height}</p>
                <p><strong>Duration:</strong> ${item.info.format.duration} seconds</p>
                <p><strong>Bitrate:</strong> ${item.info.format.bit_rate} bps</p>
            `;
            details.appendChild(videoInfo);

            item.info.streams.forEach(stream => {
                if (stream.codec_type === 'audio') {
                    const audioInfo = document.createElement('div');
                    audioInfo.innerHTML = `
                        <p><strong>Audio Codec:</strong> ${stream.codec_name}</p>
                        <p><strong>Audio Codec Long Name:</strong> ${stream.codec_long_name}</p>
                        <p><strong>Language:</strong> ${stream.tags && stream.tags.language ? stream.tags.language : 'N/A'}</p>
                        <p><strong>Channels:</strong> ${stream.channels}</p>
                        <p><strong>Channel Layout:</strong> ${stream.channel_layout}</p>
                    `;
                    details.appendChild(audioInfo);
                }
            });
        }

        if (item.type === 'directory' && item.contents) {
            const subItems = displayMediaInfo(item.contents);
            details.appendChild(subItems);
        }

        mediaItem.appendChild(details);
        fragment.appendChild(mediaItem);
    });
    return fragment;
}

function filterMediaInfo(data, filters) {
    return data.filter(item => {
        if (item.type === 'video' && item.info) {
            const videoStream = item.info.streams.find(stream => stream.codec_type === 'video');
            const audioStreams = item.info.streams.filter(stream => stream.codec_type === 'audio');

            const videoCodecMatch = !filters.videoCodec || (videoStream && videoStream.codec_name.toLowerCase().includes(filters.videoCodec));
            const audioCodecMatch = !filters.audioCodec || audioStreams.some(stream => stream.codec_name.toLowerCase().includes(filters.audioCodec));
            const audioChannelsMatch = !filters.audioChannels || audioStreams.some(stream => stream.channels == filters.audioChannels);
            const videoResolutionMatch = !filters.videoResolution || (videoStream && `${videoStream.width}x${videoStream.height}` === filters.videoResolution);

            return videoCodecMatch && audioCodecMatch && audioChannelsMatch && videoResolutionMatch;
        }

        if (item.type === 'directory' && item.contents) {
            item.contents = filterMediaInfo(item.contents, filters);
            return item.contents.length > 0;
        }

        return false;
    });
}

function populateFilterOptions(data) {
    const videoCodecs = new Set();
    const audioCodecs = new Set();
    const audioChannels = new Set();
    const videoResolutions = new Set();

    function extractOptions(items) {
        items.forEach(item => {
            if (item.type === 'video' && item.info) {
                const videoStream = item.info.streams.find(stream => stream.codec_type === 'video');
                const audioStreams = item.info.streams.filter(stream => stream.codec_type === 'audio');

                if (videoStream) {
                    videoCodecs.add(videoStream.codec_name);
                    videoResolutions.add(`${videoStream.width}x${videoStream.height}`);
                }

                audioStreams.forEach(stream => {
                    audioCodecs.add(stream.codec_name);
                    audioChannels.add(stream.channels);
                });
            }

            if (item.type === 'directory' && item.contents) {
                extractOptions(item.contents);
            }
        });
    }

    extractOptions(data);

    const videoCodecSelect = document.getElementById('videoCodec');
    videoCodecs.forEach(codec => {
        const option = document.createElement('option');
        option.value = codec;
        option.textContent = codec;
        videoCodecSelect.appendChild(option);
    });

    const audioCodecSelect = document.getElementById('audioCodec');
    audioCodecs.forEach(codec => {
        const option = document.createElement('option');
        option.value = codec;
        option.textContent = codec;
        audioCodecSelect.appendChild(option);
    });

    const audioChannelsSelect = document.getElementById('audioChannels');
    audioChannels.forEach(channels => {
        const option = document.createElement('option');
        option.value = channels;
        option.textContent = channels;
        audioChannelsSelect.appendChild(option);
    });

    const videoResolutionSelect = document.getElementById('videoResolution');
    videoResolutions.forEach(resolution => {
        const option = document.createElement('option');
        option.value = resolution;
        option.textContent = resolution;
        videoResolutionSelect.appendChild(option);
    });
}