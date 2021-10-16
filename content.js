let errors = []

function printStackTrace(e) {
    if (e.stack) {
        console.log(e.stack);
    } else {
        console.log(e.message, e);
    }
}

function check(func) {
    try {
        return func();
    } catch (e) {
        return false;
    }
}

function resolveUrl(url) {
    if (url.searchParams.has("name")) {
        url.searchParams.set("name", "orig");
    }
    return `${url.origin}${url.pathname}?${url.searchParams}`;
}

function expand(imageContainer) {
    let imagePadding = imageContainer.children[0];
    let imageDummy = imageContainer.children[1].firstElementChild;
    if (!imageContainer.children[1].hasChildNodes()) {
        // 読み込み中
        return false;
    }
    let displayImage = imageDummy.children[0];
    let image = imageDummy.children[1];
    if (image == undefined) {
        return false;
    }
    let url = new URL(displayImage.style.backgroundImage.substring("url('".length, displayImage.style.backgroundImage.length - "')".length));
    let resolvedUrl = resolveUrl(url);
    if (image.src != resolvedUrl) {
        displayImage.style.backgroundImage = `url("${resolvedUrl}")`;
        image.src = resolvedUrl;
    }
    if (image.naturalWidth == 0 || image.naturalHeight == 0) {
        return false;
    }

    imageDummy.style.margin = null;
    imagePadding.style.paddingBottom = `${(image.naturalHeight / image.naturalWidth) * 100}%`;
    return true;
}

function expandMultiple(imageContainer) {
    const marginSize = 4;
    let imagePadding = imageContainer.previousElementSibling;
    
    let imageAs = [];
    let imageColumns = Array.from(imageContainer.lastElementChild.children);
    let maxChildCount = imageColumns.reduce((a, b) => Math.max(a.childElementCount, b.childElementCount));
    for (let i = 0; i < maxChildCount; i++) {
        imageColumns.forEach(imageColumn => {
            if (imageColumn.querySelectorAll("a")[i] != undefined) {
                imageAs.push(imageColumn.querySelectorAll("a")[i]);
            }
        });
    }

    let flag = false;
    imageAs.forEach(imageA => {
        if (!imageA.firstElementChild.hasChildNodes()) {
            // 読み込み中
            flag = true;
            return;
        }
        let imageDummy = imageA.firstElementChild.firstElementChild;
        imageDummy.style.margin = null;
        let displayImage = imageDummy.children[0];
        let image = imageDummy.children[1];
        let url = new URL(displayImage.style.backgroundImage.substring("url('".length, displayImage.style.backgroundImage.length - "')".length));
        let resolvedUrl = resolveUrl(url);
        if (displayImage.style.backgroundImage != `url("${resolvedUrl}")`) {
            displayImage.style.backgroundImage = `url("${resolvedUrl}")`;
            image.src = resolvedUrl;
        }
    });
    imageAs.forEach(imageA => {
        let imageDummy = imageA.firstElementChild.firstElementChild;
        if (imageDummy == null) {
            flag = true;
            return;
        }
        let image = imageDummy.children[1];
        if (!image.complete) {
            flag = true;
            return;
        }
    });
    if (flag){
        return false;
    }

    let width = 0;
    imageAs.forEach(imageA => {
        let image = imageA.firstElementChild.firstElementChild.children[1];
        if (image.naturalWidth > width) {
            width = image.naturalWidth;
        }
    });

    let height = (imageAs.length - 1) * marginSize;
    imageAs.forEach(imageA => {
        let image = imageA.firstElementChild.firstElementChild.children[1];
        let ratio = width / image.naturalWidth;
        height += image.naturalHeight * ratio;
    });
    imagePadding.style.paddingBottom = `${(height / width) * 100}%`;
    imageAs.forEach(imageA => {
        let image = imageA.firstElementChild.firstElementChild.children[1];
        let ratio = width / image.naturalWidth;
        imageA.style.height = `${((image.naturalHeight * ratio) / height) * 100}%`;
        imageA.style.margin = `0 0 ${marginSize}px 0`;
    });
    imageAs.slice(-1)[0].style.margin = null;

    let parent = imageColumns[0];
    while (parent.firstChild) {
        parent.removeChild(parent.lastChild);
    }
    imageColumns.slice(1).forEach(imageColumn => {
        imageColumn.style.display = "none";
    });
    imageAs.forEach(imageA => {
        parent.appendChild(imageA);
    });
    return true;
}

setInterval(function () {
    let tweets;
    if (location.pathname.startsWith("/i")) {
        tweets = document.querySelectorAll('section[aria-labelledby^="accessible-list-"][role="region"] > h1[role="heading"] + div > div');
    } else {
        tweets = document.querySelectorAll('section[aria-labelledby^="accessible-list-"][role="region"] > h1[role="heading"] + div > div > div');
    }
    tweets.forEach(tweet => {
        try {
            if (tweet.getAttribute("expanded") == "true" || !tweet.hasChildNodes()) {
                return;
            }
            let tweetContainer = tweet.querySelector("[data-testid=tweet] > div > div > div > div:nth-child(2)");
            if (tweetContainer == null) {
                return;
            }
            let fields = tweetContainer.children[1].children[1];
            if (fields == undefined || (fields.childElementCount == 4 && fields.lastElementChild.getAttribute("role") != "group")) {
                // プロモーション
                return;
            }
            let imageField;
            if (fields.childElementCount == 4) {
                // 返信
                imageField = fields.children[2];
            } else {
                // ツイート
                imageField = fields.children[1];
            }
            if (!imageField.hasChildNodes()) {
                // 画像無し
                return;
            }
            if (imageField.querySelector(`[data-testid="videoPlayer"]`) != null) {
                // 動画
                return;
            }

            if (check(() => imageField.firstElementChild.childElementCount == 2)) {
                // 画像付き引用ツイート
                console.log("画像付き引用ツイート", tweet);
                let aOrDiv = imageField.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.lastElementChild;
                if (aOrDiv.tagName == "A") {
                    // 画像一枚の時
                    let imageContainer = aOrDiv.firstElementChild;
                    if (expand(imageContainer)) {
                        tweet.setAttribute("expanded", "true");
                    }
                } else {
                    // 画像複数枚の時
                    let imageContainer = aOrDiv;
                    if (expandMultiple(imageContainer)) {
                        tweet.setAttribute("expanded", "true");
                    }
                }
            } else if (check(() => imageField.firstElementChild.firstElementChild.lastElementChild.getAttribute("data-testid") == "card.wrapper")) {
                // Embed
            } else if (check(() => [2, 3].includes(imageField.firstElementChild.lastElementChild.firstElementChild.children[1].firstElementChild.childElementCount))) {
                // 引用ツイート
                console.log("引用ツイート", tweet);
                if (imageField.firstElementChild.lastElementChild.firstElementChild.lastElementChild.firstElementChild.childElementCount == 2) {
                    // 画像無し
                    return;
                }
                let aOrDiv = imageField.firstElementChild.lastElementChild.firstElementChild.lastElementChild.firstElementChild.lastElementChild
                    .firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild;
                if (aOrDiv.tagName == "A") {
                    // 画像一枚の時
                    let imageContainer = aOrDiv.firstElementChild;
                    if (expand(imageContainer)) {
                        tweet.setAttribute("expanded", "true");
                    }
                } else {
                    // 画像複数枚の時
                    let imageContainer = aOrDiv;
                    if (expandMultiple(imageContainer)) {
                        tweet.setAttribute("expanded", "true");
                    }
                }
            } else if (check(() => imageField.firstElementChild.firstElementChild.firstElementChild.firstElementChild.lastElementChild.hasChildNodes())) {
                // メディア付きツイート
                console.log("メディア付きツイート", tweet);
                let aOrDiv = imageField.firstElementChild.firstElementChild.firstElementChild.firstElementChild.lastElementChild.lastElementChild;
                if (aOrDiv.tagName == "A") {
                    // 画像一枚の時
                    let imageContainer = aOrDiv.firstElementChild;
                    if (expand(imageContainer)) {
                        tweet.setAttribute("expanded", "true");
                    }
                } else {
                    // 画像複数枚の時
                    let imageContainer = aOrDiv;
                    if (expandMultiple(imageContainer)) {
                        tweet.setAttribute("expanded", "true");
                    }
                }
            }
        } catch (e) {
            if (!errors.includes(tweet)) {
                errors.push(tweet);
                console.log("Failed to expand tweet", tweet);
                printStackTrace(e);
            }
        }
    });
}, 100);