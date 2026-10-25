# 06 — CV Taxonomy Specification

## Model
A resource can belong to multiple nodes across distinct dimensions. Use stable slug/code IDs, bilingual labels, aliases, parent-child relationships, editorial ownership and versioning. AI classification proposes existing IDs; moderators approve new nodes.

## Dimensions and initial seeds
**task:** image-classification, object-detection, semantic-segmentation, instance-segmentation, panoptic-segmentation, object-tracking, optical-flow, pose-estimation, depth-estimation, 3d-reconstruction, slam, image-retrieval, ocr, document-understanding, action-recognition, video-understanding, image-restoration, image-generation, video-generation, image-captioning, visual-question-answering, visual-grounding.

**architecture:** cnn, vision-transformer, detection-transformer, diffusion, gan, encoder-decoder, multimodal-transformer, hybrid.

**domain:** autonomous-driving, robotics, medical-imaging, industrial-inspection, surveillance, agriculture, remote-sensing, retail, document-ai, sports-analytics.

**modality:** rgb-image, rgb-video, thermal, infrared, rgbd, stereo, lidar, point-cloud, medical-volume, satellite-image.

**framework:** pytorch, tensorflow, jax, opencv, onnx-runtime, tensorrt, openvino, mmdetection, ultralytics.

**deployment:** cloud, edge, mobile, embedded, browser, real-time.

**difficulty:** beginner, intermediate, advanced, research.

**geography:** vietnam, international (not a proxy for author nationality; use separately verified origin metadata).

## Model family handling
Model families (YOLO, DETR, SAM, CLIP etc.) should eventually be entities, not solely free-form tags. During MVP use normalized family labels only when validated. Avoid claiming all members of a family share the same license/performance.

## Validation
- No cross-dimension parent references.
- No cycles or duplicate slug within a dimension.
- Every node has stable slug, English label and Vietnamese label.
- Synonyms are aliases, not duplicate nodes (e.g. `object detection`, `phát hiện đối tượng`).
- Preserve historical assignments on rename; use redirects for retired slugs.

## UX
Browse by task first; allow filters by domain, architecture, modality, framework, hardware and difficulty. Each task landing page aggregates paper, repo, news, learning and (later) dataset/model/job resources.
