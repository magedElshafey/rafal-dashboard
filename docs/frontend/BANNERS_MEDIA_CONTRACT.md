# Banners media contract note

The product BRD describes separate desktop and mobile images with optional scheduling. The current Laravel contract exposes one `image`/`image_url` plus `platform = web | mobile | both`. The frontend therefore sends exactly one image and does not invent desktop/mobile image fields. Backend/product clarification is required before expanding this model.

The update contract has no image-removal field. The edit UI can preview and replace the current remote image; removing it requires selecting a replacement before submission. Unchanged remote URLs are never resubmitted as files.

No backend file-size or dimension limits were supplied. Banners currently apply a documented frontend assumption of 5 MB per image and no dimension/aspect-ratio constraint. The shared uploader keeps both settings configurable so confirmed backend limits can replace this assumption without changing the primitive.
