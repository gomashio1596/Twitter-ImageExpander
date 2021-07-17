let errors = []

function printStackTrace(e) {
    if (e.stack) {
        console.log(e.stack);
    } else {
        console.log(e.message, e);
    }
}

setInterval(function () {
    let tweets = document.querySelectorAll("section > div > div div");
    tweets.forEach(tweet => {
        try {
            if (tweet.getAttribute("expanded") == "true") {
                return;
            }
            let tweetContainer = tweet.querySelector("div > div > article > div > div > div > div[data-testid=tweet]");
            if (tweetContainer == null) {
                return;
            }
            let imageField = tweetContainer.children[1].children[1].children[1];
            if (!imageField.hasChildNodes()) {
                return;
            }
            let aOrDiv = imageField.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild;
            if (aOrDiv.tagName == "A") {
                // 画像一枚の時
                let imageContainer = aOrDiv.firstElementChild;
                let imagePadding = imageContainer.children[0];
                let imageDummy = imageContainer.children[1]
                let image = imageDummy.firstElementChild.children[1];
                if (!image.complete) {
                    return;
                }
                imageDummy.style.marginLeft = null;
                imagePadding.style.paddingBottom = `${(image.naturalHeight / image.naturalWidth) * 100}%`;
            } else {
                // 画像複数枚の時 何も思いつかん
                let imageContainer = aOrDiv;
                let imagePadding = imageContainer.children[0];
                Array.from(imageContainer.children[1].firstElementChild).forEach(imageAOrDiv => {
                    if (imageAOrDiv.tagName == "A") {
                        // 複数枚ある画像の縦に並んでないやつ
                        let image = imageAOrDiv.firstElementChild.firstElementChild.children[1]
                        if (!image.complete) {
                            return;
                        }
                    } else {
                        Array.from(imageAOrDiv.children).forEach(a => {
                            // 複数枚ある画像の縦に並んでるやつ
                            let image = imageAOrDiv.firstElementChild.firstElementChild.children[1]
                            if (!image.complete) {
                                return;
                            }
                        });
                    }
                });
            }
            tweet.setAttribute("expanded", "true");
        } catch (e) {
            if (!tweet in errors) {
                errors.push(tweet);
                console.log("Failed to expand tweet", tweet);
                printStackTrace(e);
            }
        }
    });
}, 100);