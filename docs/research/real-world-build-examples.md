# Real builds for a Metatransformer project library

Research cutoff: **2026-10-17**. This is a source review, not a claim that we assembled or ran these devices.
Publication dates below describe the cited guide or announcement, not necessarily the first physical prototype.
A guide's January 2025 edit date is not evidence that its 2019–2024 hardware was rebuilt in 2025.
Repositories are mutable: pin a known revision and verify its hardware/software combination before publishing an adapted tutorial.

The useful pattern is already visible: finished object → inspect source → change one thing → build again.
Recent examples include printable AI figurines (2025), local Pi LLM experiments (2025), a documented backyard classifier build (2026), and local Reachy conversation (2026).
Older complete guides remain useful foundations; they are identified explicitly rather than presented as new discoveries.
The tiers below are editorial judgments: **starter** = one observable loop, **next** = several interfaces, **advanced** = mechanics/control or substantial compute integration.
No unsourced total-cost estimates are included. A repository license badge alone is not treated as permission for every linked CAD file, model, image, or dataset.

## 1. NeoPixel Glance Thermometer — Adafruit

- **Category / tier:** small sensor and output; starter.
- **Primary source:** [Metro experiment, wiring and complete sketch](https://learn.adafruit.com/experimenters-guide-for-metro/circ18-make%20it%20better).
- **Date:** parent guide published 2017-08-18; edited 2025-01-22. This is an older electronics foundation.
- **Built evidence:** official worked circuit, wiring illustration and runnable sketch; weaker physical-demo evidence than the video-backed projects below.
- **Hardware/toolchain:** Metro Express, analog temperature sensor on A0, built-in NeoPixel, Arduino and Adafruit NeoPixel library.
- **AI role:** none verified. A future agent-assisted version would be our addition, not a claim about the source.
- **Artifacts:** wiring and native C++ sketch; no enclosure necessary or supplied by this experiment.
- **Dependencies:** no runtime network/API; a computer is needed to compile and flash.
- **Learning value:** trace measurement → conversion → threshold → visible color, then change a threshold and observe it.
- **Reproduction gap:** board voltage/ADC assumptions are embedded in the sketch; porting to ESP32 requires revisiting them.
- **Library use:** excellent smallest physical feedback loop, though not evidence of contemporary AI by itself.
- **Tools/equipment:** USB data cable, computer, breadboard/jumpers; multimeter useful for voltage checks.
- **Workshop library:** Analog sensor and Metro part definitions; record owned board/sensor quantities separately; reusable threshold/color module.


## 2. NeoPixel Sprite Weather Display — Liz Clark / Adafruit

- **Category / tier:** tiny networked output; starter after local LEDs.
- **Primary source:** [project guide and source download](https://learn.adafruit.com/neopixel-sprite-weather-display).
- **Date:** published 2022-12-21; major update still dated 2022; guide edited 2025-01-22.
- **Built evidence:** the guide embeds working sprite/scrolling-temperature demonstrations and lists the parts.
- **Hardware/toolchain:** QT Py ESP32-S2, 5×5 NeoPixel Grid BFF, CircuitPython, soldered headers.
- **AI role:** none verified; weather conditions are API data, not inferred by an LLM.
- **Artifacts:** Python application and display assets; board assembly guidance; no custom mechanical design required.
- **Dependencies:** Wi-Fi and Open-Meteo; the guide's API needs no key. Runtime remains dependent on that service and its response format.
- **Learning value:** separate a data provider from presentation; change a sprite or temperature color without changing the circuit.
- **Reproduction gap:** refresh the API contract and CircuitPython/library versions before packaging it as a current example.
- **Library use:** useful optional branch for API-to-physical-output work, not a required AI prerequisite.
- **Tools/equipment:** Soldering iron, solder, computer and USB data cable.
- **Workshop library:** QT Py and BFF definitions plus owned units; sprite set and weather-adapter module can serve later displays.


## 3. Circuit Playground Bluefruit Micro Speech — Adafruit

- **Category / tier:** local audio classification; next, or starter with prebuilt firmware.
- **Primary source:** [Micro Speech demo, UF2 and source references](https://learn.adafruit.com/tensorflow-lite-for-circuit-playground-bluefruit-quickstart/micro-speech-demo).
- **Date:** guide published 2019-12-15; edited 2025-01-22. Historical foundation, not a newly demonstrated 2025 stack.
- **Built evidence:** demo video, ready-to-flash Yes/No UF2, and compilation instructions.
- **Hardware/toolchain:** Circuit Playground Bluefruit microphone, optional display path shown by the guide, Arduino and Adafruit TensorFlow Lite/Arcada libraries.
- **AI role:** runtime keyword classification on the microcontroller; neither general conversation nor an LLM.
- **Artifacts:** UF2, C++ example and display assets; no CAD needed.
- **Dependencies:** no inference API; downloads/toolchain setup require internet initially.
- **Learning value:** confidence, limited classes and input quality before introducing conversational models.
- **Reproduction gap:** guide explicitly uses Adafruit's adapted example, not the stock TensorFlowLite example; old build dependencies need verification.
- **Library use:** adapt the concept onto a maintained board/toolchain; retain a known-good flashable artifact and editable source together.
- **Tools/equipment:** Computer and USB data cable; no soldering for the integrated microphone path.
- **Workshop library:** Board definition, model/firmware version and owned board; reusable local keyword-recognition module.


## 4. AI 3D Printed Figure — Ruiz Brothers / Adafruit

- **Category / tier:** AI-assisted physical design; starter for remixing an existing mesh, next for generation-to-print.
- **Primary source:** [complete figure workflow and printable model](https://learn.adafruit.com/ai-figure?view=all).
- **Date:** published and edited 2025-04-22.
- **Built evidence:** photographed/video-demonstrated Limor and Phil figurines; the guide reports an actual print, not only generated renders.
- **Hardware/toolchain:** multicolor FDM printer; ChatGPT image generation, Masterpiece X image-to-3D, Blender mesh repair and Bambu Studio.
- **AI role:** during creation only; there is no runtime electronics or AI inside the finished figure.
- **Artifacts:** downloadable finished STL; process for generation, mesh checking, coloring and supports. No parametric native CAD source is established.
- **Dependencies:** the documented generation steps use online services; slicing and printing can be local after export.
- **Learning value:** inspect disconnected geometry/normals, alter a mesh, preview supports, print and compare physical results.
- **Reproduction gap:** stochastic generation cannot promise the same result; service access and asset reuse terms need separate checks.
- **Library use:** strong proof of AI-to-physical creation; an original printable desk mascot avoids republishing branded likeness assets.
- **Tools/equipment:** FDM printer, compatible filament, slicer and mesh editor; multicolor printing equipment for the documented result.
- **Workshop library:** Editable original mesh and print profile; printer is reusable equipment, filament is material, printed output becomes a new owned part.


## 5. Raspberry Pi 400 CYBERDECK Expansion Plate — Ruiz Brothers

- **Category / tier:** custom cyberdeck and mechanical customization; next.
- **Primary sources:** [plate, CAD and fabrication guide](https://learn.adafruit.com/cyberdeck-plate?view=all), [HAT/Bonnet electronics guide](https://learn.adafruit.com/cyberdeck-bonnet-and-hat?view=all).
- **Date:** plate published 2021-03-31; edited 2024-03-08. A reproducible older foundation rather than a 2026 cyberdeck claim.
- **Built evidence:** assembled Pi 400 deck, display and mounting plate shown in demonstration videos.
- **Hardware/toolchain:** Pi 400, CYBERDECK HAT/Bonnet, PiTFT; optional breakout such as a thermal camera; 3D printer, laser cutter or CNC.
- **AI role:** none verified. Combining this with local LLM software would be our proposed adaptation.
- **Artifacts:** STL plus STEP/Fusion 360 source with parameters; SVG/DXF for flat fabrication; mounting hardware and related electronics guides.
- **Dependencies:** fabrication and Linux/display setup; no runtime cloud service required for the base build.
- **Learning value:** modify real mounting geometry and preserve clearances, rather than merely recolor a rendered enclosure.
- **Reproduction gap:** Pi 400 geometry and display setup do not automatically transfer to Pi 5/500; newer hardware needs a new fit check.
- **Library use:** unusually good native-source/preview example; a custom deck can remain useful without mandatory AI inference hardware.
- **Tools/equipment:** Computer plus a chosen fabrication tool/service; screwdriver and suitable fasteners.
- **Workshop library:** Parameterized mount design, display/board definitions and actual owned units; printer/laser/CNC is equipment, screws are BOM components.


## 6. Local LLMs on Raspberry Pi — Tim C / Adafruit

- **Category / tier:** local AI computer; next, and a possible cyberdeck software branch.
- **Primary source:** [guide, commands and evaluation results](https://learn.adafruit.com/local-llms-on-raspberry-pi?view=all).
- **Date:** published 2025-09-10; edited 2025-09-18.
- **Built evidence:** source documents running models and evaluation results on Pi hardware; it is a working compute guide, not a custom enclosure build.
- **Hardware/toolchain:** Raspberry Pi 5/Linux; model-specific inference stacks including llama.cpp and BitNet paths.
- **AI role:** runtime local text generation; model size/quantization are practical constraints, not equivalent to a hosted frontier model.
- **Artifacts:** installation/configuration commands and model references; no electrical or mechanical files because it uses an existing SBC.
- **Dependencies:** initial downloads/builds and sufficient storage/RAM; inference can be local once the selected stack is installed.
- **Learning value:** swap a model and measure latency/quality on the same machine.
- **Reproduction gap:** toolchain/model revisions and memory requirements must be pinned for a particular lesson; do not promise a universal Pi performance number.
- **Library use:** pair with an independently designed cyberdeck enclosure only after checking thermal, power and space requirements.
- **Tools/equipment:** Computer/terminal, microSD preparation and suitable Pi power/cooling.
- **Workshop library:** Owned Pi/storage, compatible power supply, model/runtime recipe and measured performance record; no new enclosure automatically implied.


## 7. XiaoZhi ESP32 AI Chatbot — 78 and community

- **Category / tier:** voice/LLM device; next.
- **Primary source:** [firmware, supported boards, breadboard demo and backend links](https://github.com/78/xiaozhi-esp32).
- **Date:** exact first-build date not established by the inspected README; assessed as a current maintained source, not assigned a fabricated launch date.
- **Built evidence:** repository links breadboard/voice demonstrations and supplies board-specific firmware, release variants and custom-board documentation.
- **Hardware/toolchain:** choose one supported ESP32-S3 audio board or a documented microphone/speaker/display assembly; ESP-IDF and C++.
- **AI role:** local wake-word processing; ASR/LLM/TTS or realtime conversation is primarily a backend function.
- **Artifacts:** native firmware, board definitions, protocol documentation; enclosure/BOM coverage varies across supported boards.
- **Dependencies:** Wi-Fi/network and default hosted service account; repository links self-hosted servers, which add their own setup and model requirements.
- **Learning value:** understand device audio versus model computation, then expose one narrow LED/device function.
- **Reproduction gap:** pin one board and firmware release; the large support matrix is not one reproducible kit. The inspected head has changed SDK requirements.
- **Library use:** promising voice reference, but package a specific tested variant and backend rather than promising compatibility with all ESP32 boards.
- **Tools/equipment:** Computer, data cable; soldering/breadboard tools only for the selected DIY variant.
- **Workshop library:** Specific board revision, mic/amp/speaker definitions and owned units; reusable voice-client and narrow device-command modules.


## 8. OpenAI Image Descriptors with MEMENTO — Liz Clark

- **Category / tier:** camera/vision device; next.
- **Primary source:** [complete guide, source and example outputs](https://learn.adafruit.com/openai-image-descriptors-with-memento?view=all).
- **Date:** published 2024-03-04; edited 2025-01-22; major update remains 2024.
- **Built evidence:** captured photos and returned descriptions appear in a gallery; complete CircuitPython application accompanies the build.
- **Hardware/toolchain:** Adafruit MEMENTO, microSD and optional battery; CircuitPython.
- **AI role:** remote multimodal image description at runtime; the camera itself does not run the large model.
- **Artifacts:** editable code, prompt settings, captured image/text pairs; integrated camera board, no custom CAD required.
- **Dependencies:** Wi-Fi, OpenAI API account/key and usage charges; verify current endpoint/model compatibility before adaptation.
- **Learning value:** compare the same image under two prompts, preserve the original image and inspect incorrect descriptions.
- **Reproduction gap:** inspected guide lists the MEMENTO board out of stock and an older card no longer stocked; current procurement needs checking.
- **Library use:** a strong source/preview pattern; an adaptation should preserve image and response provenance rather than present descriptions as measured truth.
- **Tools/equipment:** Computer, USB cable and microSD preparation; optional enclosure fabrication separately.
- **Workshop library:** Camera/storage/battery definitions and owned quantities; reusable capture/prompt/result module and image-response test examples.


## 9. BirdNET-Pi backyard installation — Tristan Kernan / Nachtzuster

- **Category / tier:** ambient sensing with local classification; next.
- **Primary sources:** [builder's 2026 installation report](https://blog.tmk.name/2026/02/27/birdnet-pi/), [maintained BirdNET-Pi fork](https://github.com/Nachtzuster/BirdNET-Pi).
- **Date:** builder article dated 2026-02-27; underlying project predates this build. Repository inspected at research cutoff.
- **Built evidence:** builder describes repurposing his Pi 4B into a deployed detector; repository supplies an actual web UI, models and installation/update scripts.
- **Hardware/toolchain:** Pi 4B in the report; supported Pi family, microphone, Linux, TensorFlow Lite classification and browser UI.
- **AI role:** local audio species classification at runtime; not conversational AI.
- **Artifacts:** software/model files and microphone guidance; a standardized weatherproof enclosure/CAD package is not established here.
- **Dependencies:** local inference and LAN UI; downloads and optional sharing/notification integrations require network access.
- **Learning value:** retain audio evidence next to classifications and learn why confidence is not certainty.
- **Reproduction gap:** OS/fork migration matters; microphone/weather exposure is a separate build task.
- **Reuse boundary:** README explicitly prohibits using BirdNET-Pi to develop a commercial product. Link as inspiration; do not assume it can be embedded in a commercial starter bundle.
- **Tools/equipment:** Computer, microphone placement/mounting tools and outdoor enclosure work if exposed.
- **Workshop library:** Owned Pi/microphone and reusable mounting design; record classifier as an external restricted dependency, not automatically redistributable stock.


## 10. Stack-chan / AI_StackChan2 — Shinya Ishikawa community and robo8080

- **Category / tier:** expressive desktop robot; next for scripted movement, advanced for integrated voice.
- **Primary sources:** [Stack-chan hardware/firmware](https://github.com/stack-chan/stack-chan), [AI_StackChan2](https://github.com/robo8080/AI_StackChan2), [community build history](https://github.com/stack-chan).
- **Date:** Stack-chan originated 2021-07-02; community page shows repository activity in September 2026. AI fork's initial date not established here.
- **Built evidence:** assembled robot video, public maker exhibitions and multiple hardware configurations; source is more than a concept announcement.
- **Hardware/toolchain:** M5Stack/Core2/CoreS3 family and servos; main project uses JavaScript/TypeScript/Moddable; AI fork uses PlatformIO.
- **AI role:** core robot can run scripted behaviors; AI fork adds remote STT and speech services. Do not conflate the two firmware stacks.
- **Artifacts:** case models, schematics/PCB layouts, firmware and application examples in the main project; fork has application source and linked assembly instructions.
- **Dependencies:** local scripted motion possible; AI fork documents Google Cloud STT or Whisper and web VOICEVOX.
- **Learning value:** change face/motion independently, then coordinate listening and speaking states.
- **Reproduction gap:** board, servo wiring and firmware variant must match; current main project and older published firmware guide differ substantially.
- **Library use:** valuable remixable desk-robot reference; begin with bounded single-axis movement before importing the complete voice stack.
- **Tools/equipment:** Computer/data cable, 3D printer or sourced case, screwdriver; soldering depends on board/servo variant.
- **Workshop library:** Servo/board definitions, owned units and reusable case, face and gesture modules; keep firmware variants distinct.


## 11. Robotic AI Bear using ChatGPT — M. LeBlanc-Williams

- **Category / tier:** LLM inside an existing animatronic object; advanced integration.
- **Primary source:** [demonstration and full build guide](https://learn.adafruit.com/robotic-ai-bear-using-chatgpt?view=all).
- **Date:** published 2023-04-04; major update 2024-04-16; edited 2025-01-22.
- **Built evidence:** operating bear demo plus photographed teardown, wiring and assembly.
- **Hardware/toolchain:** GUND Peek-A-Boo bear, Pi 4, DC/Stepper Motor HAT, microphone, speaker and USB power bank; Python/Blinka.
- **AI role:** runtime conversation and speech services; existing DC mechanisms animate mouth/arms. This is not a servo or general-purpose autonomous robot.
- **Artifacts:** circuit diagram, printable internal enclosure, source application and detailed reassembly instructions.
- **Dependencies:** network plus OpenAI and Azure services; Linux audio setup and service credentials are substantive parts of the build.
- **Learning value:** preserve useful mechanics while replacing the interaction layer; separate speech timing from motor output.
- **Reproduction gap:** donor toy variations and older API/audio dependencies require fresh verification; the guide explicitly does not claim its alternate Pi boards were tested.
- **Library use:** compelling inspiration for the user's robot example, but a simpler original desktop shell would make a more controlled early lesson.
- **Tools/equipment:** Screwdrivers, flush cutters/soldering tools, computer and printer for the compact enclosure.
- **Workshop library:** Donor-toy mechanisms, owned Pi/motor HAT and reusable audio/motor modules; donor-specific geometry belongs with the actual revision.


## 12. LeKiwi mobile manipulator — SIGRobotics UIUC / LeRobot

- **Category / tier:** mobile robot; advanced.
- **Primary sources:** [hardware repository](https://github.com/SIGRobotics-UIUC/LeKiwi), [BOM](https://github.com/SIGRobotics-UIUC/LeKiwi/blob/main/BOM.md), [assembly](https://github.com/SIGRobotics-UIUC/LeKiwi/blob/main/Assembly.md), [LeRobot software guide](https://huggingface.co/docs/lerobot/lekiwi).
- **Date:** inspected Version 1 project and current docs; exact first prototype date not established in these pages.
- **Built evidence:** photographed assembly, wiring/BOM and real-device calibration/teleoperation/data-collection instructions.
- **Hardware/toolchain:** Pi 5, three omni wheels, servos, cameras and SO-ARM101; printed stacked chassis; Python/LeRobot and a laptop.
- **AI role:** teleoperation itself is not AI; recorded demonstrations can feed learned policies through LeRobot.
- **Artifacts:** printable meshes, Fusion CAD link, URDF, BOM and assembly; software lives in LeRobot rather than entirely in the hardware repository.
- **Dependencies:** robot-to-laptop network; policy training/inference compute depends on the selected method. Pi control hardware does not imply Pi-only training.
- **Learning value:** calibrate, teleoperate and record first; learned execution is a later experiment over a defined task/workspace.
- **Reproduction gap:** multiple voltage/hardware variants and hardware/software version alignment; the README labels some capabilities as goals, so use executable docs as stronger evidence.
- **Library use:** advanced destination; omit the arm initially if designing our own simpler rover curriculum, clearly labeling that as an original adaptation.
- **Tools/equipment:** 3D printer or print service, screwdrivers, computer and wiring tools appropriate to the chosen BOM.
- **Workshop library:** Motor/wheel/camera/arm definitions and owned counts; chassis CAD, calibration records and teleoperation modules; equipment stays separate.


## 13. Reachy Mini conversation robot — Pollen Robotics / Hugging Face

- **Category / tier:** advanced open desktop robot; advanced integration, approachable app remix on an assembled kit.
- **Primary sources:** [SDK](https://github.com/pollen-robotics/reachy_mini), [hardware/setup documentation](https://huggingface.co/docs/reachy_mini/main/index), [conversation app](https://github.com/pollen-robotics/reachy_mini_conversation_app), [local conversation demonstration](https://huggingface.co/blog/local-reachy-mini-conversation).
- **Date:** local-conversation article published 2026-05-27; current docs also cover Lite and Wireless hardware. Do not apply early preorder language to the present kit.
- **Built evidence:** working conversation demonstration, SDK examples, motor diagnostics and real-kit setup documentation.
- **Hardware/toolchain:** expressive head/base/antennas, camera and audio; Lite connects to a computer, Wireless includes CM4/battery/Wi-Fi; Python SDK.
- **AI role:** runtime speech/LLM conversation and optional camera/tool use; expressive motion is mediated by robot software.
- **Artifacts:** SDK/app code, example behaviors and hardware/setup docs. A complete independently manufacturable CAD/electronics/BOM package was not verified in this pass.
- **Dependencies:** hosted backends or a separately configured local voice/model backend; “fully local” does not mean every model runs on the onboard CM4.
- **Learning value:** change one personality/tool/gesture and compare behavior; inspect source and recordings before adding another capability.
- **Reproduction gap:** model compute, backend settings and kit revision matter; current app labels some local interruption behavior experimental.
- **Library use:** strong advanced exemplar of play/open/modify; bounded expressive desktop motion is not evidence of safe free-roaming autonomy.
- **Tools/equipment:** Computer for Lite/backend work, supplied assembly tools or specified kit tools; extra local compute depends on model.
- **Workshop library:** Owned kit/revision, separately catalogued backend computer, reusable behaviors/tool definitions and compatible accessory designs.


## Proposed tutorial progression — our work, not claims of existing tutorials

These are **proposed original/adapted lessons**, not a promise to implement all of them in the MVP.
Each should ship native editable sources, a known-good preview/result, a parts list and a short observable success check.
Studio can open these local repositories and previews; physical assembly remains explicit and simulation is optional.
Each lesson should distinguish reusable part definitions, particular owned units/quantities, BOM allocations, tools/equipment and reusable designs/software.
A soldering iron, printer or multimeter is a tool prerequisite, not a consumed BOM component; unavailable equipment may change the fabrication route.
Recording a BOM never implies a purchase or automatically decrements stock. Users explicitly record assembly, disassembly and inventory changes.
The progression accumulates a workshop: light module → shell → servo mechanism → voice module → vision module → compute deck → mobility → reusable robot behavior.

| Step | Proposed lesson | One new concept | Source inspiration and adaptation boundary |
| --- | --- | --- | --- |
| 1 | Room-color light | Sensor-to-output loop | Original small circuit inspired by the Metro thermometer; change a threshold and observe color. |
| 2 | Custom printed light shell | Physical geometry and fit | Original shell; borrow the figure guide's inspect/repair/print workflow, not its character assets. |
| 3 | One-servo desk creature | Bounded actuator control | Original single-axis mechanism inspired by Stack-chan; change a motion range and preview it. |
| 4 | Talking desk creature | Voice/backend boundary | Adapt a verified XiaoZhi configuration; trigger an existing bounded gesture through a narrow command. |
| 5 | “What am I looking at?” camera | Image-to-model evidence | Adapt the MEMENTO interaction on available hardware; preserve photo, prompt and result together. |
| 6 | My own AI cyberdeck | Local compute packaging | Original CAD plus verified Pi inference recipe; customize the layout and benchmark the same model. |
| 7 | Drive and replay a little rover | Recorded physical trajectories | Original simpler mobile platform; LeKiwi informs the later calibration/recording branch, not a one-click AI promise. |
| 8 | Remix a Reachy Mini behavior | A reusable robot skill | Adapt the SDK/app workflow on a real kit; add one tool or gesture before attempting more integrated behavior. |

Branches, not prerequisites: local keyword spotting and bird classification offer useful alternatives to paid conversational APIs.
Before selecting a starter, reproduce that exact board/firmware/service combination once; source completeness is evidence of plausibility, not execution proof.
For imported material, record software, hardware, model and media permissions separately; linked projects can remain references when redistribution is inappropriate.
