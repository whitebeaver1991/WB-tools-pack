var COLORS = ['#dc5050','#50c864','#5050dc','#dcc83c','#b43cb4','#3cc8c8','#f08c28','#a0a0a0','#c8c8c8'];
var MAX = 9, PAGES = 3;
var labelMap = ['Pie','Quick','Wheel','Infinite'];

var curMenu = 0, curPage = 0;
var pieCount = 4, quickCount = 6;
var triggerKey = 32, triggerMod = 6, winAlpha = 60;
var prevPageKey = 90, nextPageKey = 88; // Z, X
var bgAlpha = [60,60,60,60], bgColor = ['2a2a2a','2a2a2a','2a2a2a','2a2a2a'], glowColor = ['3cb93c','3cb93c','3cb93c','3cb93c'], glowIntensity = [100,100,100,100];
var pageColor = ['78787d','78787d','78787d','78787d'];
var imgDist = [45,45,45,45], textDist = [85,85,85,85], textSize = [100,100,100,100], uiZoom = [100,100,100,100], menuScale = [100,100,100,100];
var numpadEnabled = false, language = 0;
var guideEnabled = false, guideColor = 'c0c0c0', guideWidth = 2;
var selectMode = 0;
var infiniteCount = 8;
var g_settingsVersion = 0;
var g_recentEffects = []; var RECENT_MAX = 10;
var g_fbRecent = [];
var g_effectsCache = null;
var g_presets = [];
var g_exportImportCallbacks = {};
var g_nameMap = null;
g_nameMap = {
'bfx Map Ramp':'bfx Map Ramp',
'PEGR':'Crate\'s Godrays',
'PEDG2':'Deep Glow 2',
'PEDX':'Displacer Pro',
'OLM Distance Gradation':'Distance Gradation',
'irrealix Dust Transition':'Dust Transition',
'CROSSPHERE_FractalNoise3D':'FractalNoise3D',
'One Chance Furikake':'Furikake',
'PEFXAA':'FXAA',
'irrealix loopFlow':'loopFlow',
'OLM OLM Blur':'OLM Blur',
'OLM Directional Blur':'OLM DirectionalBlur',
'OLM RadialBlur':'OLM RadialBlur',
'OLM Smoother':'OLM Smoother',
'OLM Smoother v2':'OLM Smoother v2',
'ADBE OLMToonDilate':'OLM Toon Dilate',
'VIDEOCOPILOT VIBRANCE':'VC Color Vibrance',
'PSOFT ANTI-ALIASING':'anti-aliasing',
'PSOFT BLURCEL':'P_BlurCel',
'PSOFT BLURRGB':'P_BlurRGB',
'PSOFT BOUNDARYLINE':'P_BoundaryLine',
'PSOFT COLORSELECTION':'P_ColorSelection',
'PSOFT DEBAND':'P_Deband',
'PSOFT DELTAFX':'P_DeltaFX',
'PSOFT EXTEND':'P_Extend',
'PSOFT FILL':'P_Fill',
'PSOFT GRADIENT':'P_Gradient',
'PSOFT REPLACECOLOR':'P_ReplaceColor',
'PSOFT TEXTURE':'P_Texture',
'PSOFT BLURCELLAYER':'P_BlurCelLayer',
'PSOFT BLURCELMULTI':'P_BlurCelMulti',
'PSOFT BLURCEL RADIAL':'P_BlurCelRadial',
'PSOFT BLURPATH':'P_BlurPath',
'PSOFT CHROMATICABERRATIONS':'P_ChromaticAberrations',
'PSOFT GLOW':'P_Glow',
'PSOFT GradientMap':'P_GradientMap',
'PSOFT InnerShadow':'P_InnerShadow',
'CINEMA 4D Effect':'Cineware',
'PSOFT FOCUS LINES':'P_FocusLines',
'PSOFT HALFTONE':'P_Halftone',
'PSOFT PATHSTROKE':'P_PathStroke',
'PSOFT SPEED LINES':'P_SpeedLines',
'Cryptomatte':'Cryptomatte',
'EXtractoR':'EXtractoR',
'IDentifier':'IDentifier',
'CC Ball Action':'CC Ball Action',
'CC Bender':'CC Bender',
'CC Bend It':'CC Bend It',
'CC Blobbylize':'CC Blobbylize',
'CS BlockLoad':'CC Block Load',
'CC Bubbles':'CC Bubbles',
'CC Burn Film':'CC Burn Film',
'CS Color Neutralizer':'CC Color Neutralizer',
'CC Color Offset':'CC Color Offset',
'CS Composite':'CC Composite',
'CC Composite':'CC Composite (obsolete)',
'CS CrossBlur':'CC Cross Blur',
'CC Cylinder':'CC Cylinder',
'CC Drizzle':'CC Drizzle',
'CC Environment':'CC Environment',
'CC Flo Motion':'CC Flo Motion',
'CC Force Motion Blur':'CC Force Motion Blur',
'CC Glass':'CC Glass',
'CC Glass Wipe':'CC Glass Wipe',
'CC Glue Gun':'CC Glue Gun',
'CC Griddler':'CC Griddler',
'CC Grid Wipe':'CC Grid Wipe',
'CC Hair':'CC Hair',
'CS HexTile':'CC HexTile',
'CC Image Wipe':'CC Image Wipe',
'CC Jaws':'CC Jaws',
'CC Kaleida':'CC Kaleida',
'CS Kernel':'CC Kernel',
'CC Lens':'CC Lens',
'CC Light Burst 2.5':'CC Light Burst 2.5',
'CC Light Rays':'CC Light Rays',
'CC Light Sweep':'CC Light Sweep',
'CC Light Wipe':'CC Light Wipe',
'CS LineSweep':'CC Line Sweep',
'CC Mr. Mercury':'CC Mr. Mercury',
'CC Mr. Smoothie':'CC Mr. Smoothie',
'CC Overbrights':'CC Overbrights',
'CC Page Turn':'CC Page Turn',
'CC PS Classic':'CC PS Classic (obsolete)',
'CC Particle Systems II':'CC Particle Systems II',
'CC PS LE Classic':'CC PS LE Classic (obsolete)',
'CC Pixel Polly':'CC Pixel Polly',
'CC Plastic':'CC Plastic',
'CC Power Pin':'CC Power Pin',
'CC Particle World':'CC Particle World',
'CC Radial Blur':'CC Radial Blur',
'CC Radial Fast Blur':'CC Radial Fast Blur',
'CC Radial ScaleWipe':'CC Radial ScaleWipe',
'CC Rain':'CC Rain (obsolete)',
'CSRainfall':'CC Rainfall',
'CC RepeTile':'CC RepeTile',
'CC Ripple Pulse':'CC Ripple Pulse',
'CC Scale Wipe':'CC Scale Wipe',
'CC Scatterize':'CC Scatterize',
'CC Simple Wire Removal':'CC Simple Wire Removal',
'CC Slant':'CC Slant',
'CC Smear':'CC Smear',
'CC Snow':'CC Snow (obsolete)',
'CSSnowfall':'CC Snowfall',
'CC Sphere':'CC Sphere',
'CC Split':'CC Split',
'CC Split 2':'CC Split 2',
'CC Spotlight':'CC Spotlight',
'CC Star Burst':'CC Star Burst',
'CS Threads':'CC Threads',
'CC Threshold':'CC Threshold',
'CC Threshold RGB':'CC Threshold RGB',
'CC Tiler':'CC Tiler',
'CC Time Blend':'CC Time Blend',
'CC Time Blend FX':'CC Time Blend FX',
'CC Toner':'CC Toner',
'CC Twister':'CC Twister',
'CC Vector Blur':'CC Vector Blur',
'CS Vignette':'CC Vignette',
'CC WarpoMatic':'CC WarpoMatic',
'CC Wide Time':'CC Wide Time',
'Keylight 906':'Keylight (1.2)',
'ISL MochaShapeImporter':'mocha shape',
'mochaAECC':'Mocha AE',
'omino color extract':'omino colorizer',
'omino_diffusion':'omino diffusion',
'omino_halftone':'omino halftone++',
'omino_kaleidoscope':'omino kaleidoscope',
'omino_snake':'omino snake',
'omino_sphere_map':'omino sphere map',
'omino squares':'omino squares',
'omino_test':'omino test',
'PSOFT PENCIL4 LINE':'P_Pencil+ 4 Line',
'tc Echospace':'Echospace',
'tc Form':'Form',
'Geo':'Geo',
'tc Trapcode Horizon':'Horizon',
'tc Lux':'Lux',
'rg Mir':'Mir 3',
'tc Particular':'Particular',
'tc Sound Keys':'Sound Keys',
'tc Tao':'Tao',
'VIDEOCOPILOT 3DArray':'Element',
'VIDEOCOPILOT HeatDistortion':'Heat Distortion',
'VIDEOCOPILOT OpticalFlares':'Optical Flares',
'VIDEOCOPILOT VCReflect':'VC Reflect',
'TumoiYorozu FastCameraLensBlur':'Fast Camera Lens Blur',
'GG PixelSorter3':'Pixel Sorter 3 ',
'Red Giant GrowBounds':'Grow Bounds',
'Mekajiki UnMult':'UnMult',
'KNSW Unmult':'UnMult',
'BorisFX SyAFXAdvLens':'SynthEyes Advanced Distortion',
'SSONTECH SyAFXLens':'SynthEyes Legacy Distortion',
'SSONTECH SyAFXMapper':'SynthEyes Image Mapper',
'ColorGeniusGrade':'Color Genius',
'DE:Fluctuate':'DEFlicker Auto Levels',
'DE:Flicker':'DEFlicker High Speed',
'DE:FlickerRollingBands':'DEFlicker Rolling Bands',
'DEFlickerTimeLapse':'DEFlicker Time Lapse',
'DE:Noise_FrameAverage':'DE:Noise Frame Average',
'DE:Noise':'DE:Noise',
'ADBE DepthScanner 2':'Depth Scanner 2',
'ReelSmart Deinterlacer':'FieldsKit Deinterlacer',
'ReelSmart Pulldown':'FieldsKit Pulldown',
'ReelSmart Reinterlacer':'FieldsKit Reinterlacer',
'RG_MB_ParamCurve_AE':'Parametric Curve',
'RG MB COLORISTA IV':'Colorista V',
'RG Cosmo_II':'Cosmo II',
'RG Denoiser3':'Denoiser III',
'Magic_Bullet_Mojo_II':'Mojo II',
'Magic_Bullet_Renoiser':'Renoiser',
'Magic_Bullet_Suite_Magic_Bullet':'Film',
'MB LookSuite3':'Looks',
'RFX Soft Edge Mask':'PV Feather',
'Universe_Blur_Blur_Premium':'uni.Blur',
'Universe_Blur_Box_Bokeh':'uni.Bokeh',
'Universe_Compound_Blur_Premium':'uni.Compound Blur',
'Universe_Blur_Spot_Blur':'uni.Spot Blur',
'Universe_CrumplePop_Finisher':'uni.Finisher',
'Universe_CrumplePop_Fisheye_Fix':'uni.Fisheye Fixer',
'Universe_CrumplePop_Grain16':'uni.Grain16',
'Universe_CrumplePop_OverLight':'uni.OverLight',
'Universe_CrumplePop_ShrinkRay':'uni.ShrinkRay',
'Universe_Distort_Camera_Shake_P':'uni.Camera Shake',
'Universe_Distort_Chromatic_Aber':'uni.Chromatic Aberration',
'Universe_Distort_Heatwave':'uni.Heatwave',
'Universe_Distort_Picture_in_Pic':'uni.Picture in Picture',
'Universe_Distort_Prism_Displace':'uni.Prism Displacement',
'Universe_Distort_RGB_Separation':'uni.RGB Separation',
'Universe_Generators_Fractal_Bac':'uni.Fractal Background',
'Universe_Generators_Gradient_Ra':'uni.Gradient Ramp',
'Universe_Generators_Soft_Gradie':'uni.Soft Gradient Background',
'Universe_Generators_Spectralici':'uni.Spectralicious',
'Universe_Glow_Chromatic_Glow':'uni.Chromatic Glow',
'Universe_Glow_Edge_Glow_Premium':'uni.Edge Glow',
'Universe_Glow_Glimmer':'uni.Glimmer',
'Universe_Glow_Glow':'uni.Glow',
'Universe_Glow_Glo_Fi_Premium':'uni.Glo Fi',
'Universe_Glow_Point_Zoom':'uni.Point Zoom',
'RG_UNI_Glow_Quantum':'uni.Quantum',
'Universe_M_G_Array_Gun':'uni.Array Gun',
'Universe_Visualizations_HUD_Com':'uni.HUD Components',
'Universe_Motion_Graphics_Draw_P':'uni.Line',
'Universe_M_G_Progresso':'uni.Progresso',
'RG_UNI_M_G_Reframe':'uni.Reframe',
'Universe_Generators_TurNoise':'uni.Turbulence Noise',
'RG_UNI_Stylize_Analog':'uni.Analog',
'Universe_Stylize_Carousel':'uni.Carousel',
'RG_UNI_Chromatown':'uni.ChromaTown',
'RG_UNI_Stylize_Electrify':'uni.Electrify',
'Universe_Stylize_Glitch':'uni.Glitch',
'Universe_Distort_Holomatrix':'uni.Holomatrix II',
'Universe_Knoll_Light_Factory_EZ':'uni.Knoll Light Factory EZ',
'Universe_Misfire_Premium':'uni.MisFire',
'RG_UNI_Stylize_Multitone':'uni.Multitone',
'Universe_Stylize_Noir_Moderne':'uni.Noir',
'Universe_CrumplePop_RetroGrade':'uni.RetroGrade',
'Universe_Stylize_Sketchify':'uni.Sketchify',
'Universe_Stylize_Symbol_Mapper':'uni.Symbol Mapper',
'Universe_Stylize_Texturize':'uni.Texturize',
'MX_UNI_Stylize_Texturize_Motion':'uni.Texturize Motion',
'Universe_Stylize_VHS':'uni.VHS',
'Universe_Text_AV_Club':'uni.AV Club',
'Universe_Text_Ecto':'uni.Ecto',
'Universe_Text_Glo_Fi_II':'uni.Glo Fi II',
'Universe_Text_Hacker_Text':'uni.Hacker Text',
'Universe_Text_Long_Shadow':'uni.Long Shadow',
'Universe_Text_Luster':'uni.Luster',
'Universe_Text_Numbers':'uni.Numbers',
'Universe_Text_Screen_Text':'uni.Screen Text',
'Universe_Text_Text_Tile':'uni.Text Tile',
'Universe_Utilities_Title_Motion':'uni.Title Motion',
'Universe_Text_Type_Cast':'uni.Type Cast',
'Universe_Text_Type_On':'uni.Type On',
'RG_UNI_Text_Typographic':'uni.Typographic',
'Universe_Transitions_Blinds':'uni.Blinds',
'Universe_Transitions_Bokeh':'uni.Bokeh Transition',
'Universe_Transitions_Camera_Sha':'uni.Camera Shake Transition',
'Universe_Transitions_Carousel_T':'uni.Carousel Transition',
'Universe_Transitions_Channel_Bl':'uni.Channel Blur',
'Universe_Transitions_Channel_Su':'uni.Channel Surf',
'Universe_Transitions_Clock_Wipe':'uni.Clock Wipe',
'Universe_Transitions_Color_Mosa':'uni.Color Mosaic Transition',
'Universe_Transitions_Color_Stri':'uni.Color Stripe',
'Universe_Transitions_Cube':'uni.Cube',
'Universe_Transitions_Diamond_Wa':'uni.Diamond Wave',
'Universe_Transitions_Dolly_Fade':'uni.Dolly Fade',
'Universe_Exposure_Blur_Premium':'uni.Exposure Blur',
'Universe_Transitions_Film_Trans':'uni.Film Transition',
'Universe_Transitions_Flicker_Cu':'uni.Flicker Cut',
'Universe_Transitions_Fold':'uni.Fold',
'Universe_Transitions_Glitch_Tra':'uni.Glitch Transition',
'Universe_Transitions_HalfLight':'uni.HalfLight',
'Universe_Transitions_Inside_Cub':'uni.Inside Cube',
'Universe_Transitions_Knoll_Ligh':'uni.Knoll Light Transition',
'Universe_Transitions_Linear_Wip':'uni.Linear Wipe',
'Universe_Transitions_RetroGrade':'uni.RetroGrade Transition',
'Universe_Transitions_Rubics_Cub':'uni.Rubix Cube',
'Universe_Transitions_Shape_Wipe':'uni.Shape Wipe',
'Universe_Transitions_Slide':'uni.Slide',
'Universe_Soft_Edge_Wipe_Premium':'uni.Soft Edge Wipe',
'Universe_Transitions_Spectralic':'uni.Spectralicious Transition',
'RG_UNI_Transition_Stretch':'uni.Stretch',
'Universe_Swish_Pan_Premium':'uni.Swish Pan',
'Universe_Transitions_Triangle_W':'uni.Triangle Wave',
'Universe_Transitions_Turbulence':'uni.Turbulence Transition',
'Universe_Transitions_Unfold':'uni.Unfold',
'Universe_Transitions_VHS_Transi':'uni.VHS Transition',
'RG_UNI_Transition_Warp':'uni.Warp',
'Universe_Utilities_Logo_Motion':'uni.Logo Motion',
'RG_UNI_Utilities_Modes':'uni.Modes',
'RG_UNI_Utilities_Socialize':'uni.Socialize',
'Universe_Utilities_Unmult_Premi':'uni.Unmult',
'rgBang':'Bang',
'RG_VFX_ChromaDisp_AE':'Chromatic Displacement',
'RG_KingPin_Tracker':'King Pin Tracker',
'RG_Lens_Distortion':'Lens Distortion Matcher',
'MX_Lens_Flare':'Real Lens Flares',
'RG_VFX_OpticalGlow_AE':'Optical Glow',
'Photron Primatte6':'Primatte Keyer 6',
'rg.vfx.reflection':'Reflection',
'rg.vfx.shadow':'Shadow',
'RG_VFX_SpotClone_Tracker_AE':'Spot Clone Tracker',
'RG_VFX_Supernova_AE':'Supercomp',
'REFill Alpha':'RE:FILL Alpha',
'ReFill AreaFill':'RE:FILL Area Fill',
'RE:Fill FrameBorder':'RE:FILL Frame Borders',
'RE:FILL Choke':'RE:FILL Choke',
'RE:FILL GrowShrink':'RE:FILL GrowShrink',
'RE:Fill Offset':'RE:FILL Offset',
'RE:Fill Blend':'RE:FILL Seamless Blend',
'ReelSmart Morph2':'RE:Flex Morph',
'ReelSmart Moving Morph':'RE:Flex Motion Morph',
'ReelSmart Morph':'RE:Flex Warp',
'GradeContrast':'RE:Grade Contrast Enhance',
'ColorAwesome':'RE:Grade Correct',
'RE:Match Defringe':'RE:Grade Fringes',
'HaldClutGen':'RE:Grade Color Admin',
'ColorContrast':'RE:Grade HDR Merge',
'ColorNormalize':'RE:Grade Normalize',
'RE:Lens Chromatic Aberration':'RE:Lens Chromatic Aberration',
'RE:Lens Defish':'RE:Lens Ultra-Wide',
'RE:Lens FromLatLong':'RE:Lens From LatLong',
'RE:Lens +Mirrors':'RE:Lens Curved Mirrors',
'RE:Lens Reframe':'RE:Lens Reframe',
'RE:Lens Set Bounds':'RE:Lens Set Bounds',
'RE:Lens Other Cases':'RE:Lens Superfish',
'RE:Lens ToLatLong':'RE:Lens To LatLong',
'RE:Map Displace':'RE:Map Displace',
'RE:Map Distort':'RE:Map Distort',
'UV Inverse Mapper':'RE:Map Inverse UV',
'RE:Map Planar':'RE:Map Planar',
'RE:Map Transform':'RE:Map Transform',
'UV Mapper Pete':'RE:Map UV ',
'ColorUnmanaged':'RE:Match Basic',
'ColorSelective':'RE:Match Color',
'ColorStereoMatch':'RE:Match Stereo',
'REZUPresize':'REZUP Resize',
'REZUP':'REZUP Enhance',
'RWB Fast Bokeh':'Fast Bokeh',
'RS Motion Blur Pro Vectors 3.x':'RSMB Pro Vectors',
'RS Motion Blur Pro A 3.x':'RSMB Pro',
'Smart Motion Blur 3.x':'RSMB',
'Shade Normals':'Shade Normals 5',
'SHAdE SHApE':'Shade Shape 5',
'SKSmoother':'SK Diffusion',
'SKDirectional':'SK Directional Per Pixel',
'SK Directional Splines':'SK Directional With Splines',
'SKFrameAccumulate':'SK Frame Accumulate',
'SKGaussianPerPixel':'SK Gaussian Per Pixel',
'SKSharpen':'SK Sharpen',
'SKGaussian':'SK Gaussian',
'SKSmoothAliasing':'SK Staircase Suppress',
'SKZBlur':'SK ZBlur',
'tc 3DStrokePath':'3D Stroke',
'tc Shine':'Shine',
'tc Starglow':'Starglow',
'Create Motion Vectors 3.x':'Motion Vectors: Create',
'Twixtor 4 Vectors In':'Twixtor Pro; Vectors In',
'Twixtor 45':'Twixtor Pro',
'Twixtor 45 Lite':'Twixtor',
'Video Gogh 3':'Video Gogh Pro',
'Video Gogh':'Video Gogh',
'ADBE 3D Tracker':'3D Camera Tracker',
'ADBE 3D Glasses2':'3D Glasses',
'ADBE 3D Glasses':'3D Glasses (Obsolete)',
'VISINF Grain Implant':'Add Grain',
'ADBE Alpha Levels2':'Alpha Levels',
'ADBE Alpha Levels3':'Alpha Levels',
'ADBE Apply Color LUT2':'Apply Color LUT',
'ADBE Apply Color LUT':'Apply Color LUT',
'ADBE Arithmetic':'Arithmetic',
'ADBE AudSpect':'Audio Spectrum',
'ADBE AudWave':'Audio Waveform',
'ADBE Aud BT':'Bass & Treble',
'ADBE Aud Delay':'Delay',
'ADBE Aud_Flange':'Flange & Chorus',
'ADBE Aud HiLo':'High-Low Pass',
'ADBE Aud Stereo Mixer':'Stereo Mixer',
'ADBE Aud Modulator':'Modulator',
'ADBE Param EQ':'Parametric EQ',
'ADBE Aud Reverb':'Reverb',
'ADBE Aud Reverse':'Backwards',
'ADBE Aud Tone':'Tone',
'ADBE AutoColor':'Auto Color',
'ADBE AutoContrast':'Auto Contrast',
'ADBE AutoLevels':'Auto Levels',
'ADBE AUX CHANNEL EXTRACT':'3D Channel Extract',
'ADBE Brightness & Contrast':'Brightness & Contrast',
'ADBE Basic 3D':'Basic 3D',
'ADBE Basic Text2':'Basic Text',
'ADBE Laser':'Beam',
'ADBE Bevel Alpha':'Bevel Alpha',
'ADBE Bevel Edges':'Bevel Edges',
'ADBE BEZMESH':'Bezier Warp',
'ADBE Bilateral':'Bilateral Blur',
'ADBE Blend':'Blend',
'ADBE Block Dissolve':'Block Dissolve',
'ADBE Box Blur2':'Fast Box Blur',
'ADBE Box Blur':'Box Blur',
'ADBE Broadcast Colors':'Broadcast Colors',
'ADBE Brush Strokes':'Brush Strokes',
'ADBE Bulge':'Bulge',
'ADBE Calculations':'Calculations',
'ADBE WRPMESH':'Warp',
'APC CardDanceCam':'Card Dance',
'APC CardWipeCam':'Card Wipe',
'ADBE Cartoonify':'Cartoon',
'APC Caustics':'Caustics',
'ADBE Cell Pattern':'Cell Pattern',
'ADBE Change To Color':'Change to Color',
'ADBE Change Color':'Change Color',
'ADBE Channel Combiner':'Channel Combiner',
'ADBE Channel Blur':'Channel Blur',
'ADBE CHANNEL MIXER':'Channel Mixer',
'ADBE Checkerboard':'Checkerboard',
'ADBE Cineon Converter':'Cineon Converter',
'ADBE Cineon Converter2':'Cineon Converter',
'ADBE Circle':'Circle',
'APC Colorama':'Colorama',
'ADBE Color Link':'Color Link',
'ADBE 4ColorGradient':'4-Color Gradient',
'ADBE Color Balance':'Color Balance',
'ADBE Color Balance 2':'Color Balance',
'ADBE Color Difference Key':'Color Difference Key',
'ADBE Color Emboss':'Color Emboss',
'ADBE Color Balance (HLS)':'Color Balance (HLS)',
'ADBE Color Key':'Color Key',
'ADBE Color Range':'Color Range',
'ADBE Compound Arithmetic':'Compound Arithmetic',
'ADBE Compound Blur':'Compound Blur',
'ADBE Corner Pin':'Corner Pin',
'ADBE CurvesCustom':'Curves',
'ADBE CameraShakeDeblur':'Camera-Shake Deblur',
'ADBE Deflicker':'Color Stabilizer',
'ADBE DEPTH FIELD':'Depth of Field',
'ADBE DEPTH MATTE':'Depth Matte',
'ADBE Difference Matte2':'Difference Matte',
'ADBE Difference':'Time Difference',
'ADBE Motion Blur':'Directional Blur',
'ADBE Displacement Map':'Displacement Map',
'ADBE Drop Shadow':'Drop Shadow',
'ADBE Dust & Scratches':'Dust & Scratches',
'ADBE Echo':'Echo',
'ADBE ELLIPSE':'Ellipse',
'ADBE Emboss':'Emboss',
'ADBE Equalize':'Equalize',
'ADBE Compander':'HDR Compander',
'ADBE Exposure2':'Exposure',
'ADBE Exposure':'Exposure',
'ADBE Checkbox Control':'Checkbox Control',
'ADBE Slider Control':'Slider Control',
'ADBE Layer Control':'Layer Control',
'ADBE Color Control':'Color Control',
'ADBE Point3D Control':'3D Point Control',
'ADBE Point Control':'Point Control',
'ADBE Angle Control':'Angle Control',
'ADBE Dropdown Control':'Dropdown Menu Control',
'ADBE Extract':'Extract',
'ADBE Eyedropper Fill':'Eyedropper Fill',
'ADBE Fast Blur':'Fast Blur (Legacy)',
'ADBE Reduce Interlace Flicker':'Reduce Interlace Flicker',
'ADBE Fill':'Fill',
'ADBE Find Edges':'Find Edges',
'APC Foam':'Foam',
'ADBE FOG_3D':'Fog 3D',
'ADBE Fractal':'Fractal',
'ADBE Fractal Noise':'Fractal Noise',
'ADBE Gaussian Blur':'Gaussian Blur (Legacy)',
'ADBE Gaussian Blur 2':'Gaussian Blur',
'ADBE Glo2':'Glow',
'ADBE Gamma/Pedestal/Gain2':'Gamma/Pedestal/Gain',
'ADBE Gradient Wipe':'Gradient Wipe',
'ADBE Grid':'Grid',
'ADBE GROW BOUNDS':'Grow Bounds',
'ADBE HUE SATURATION':'Hue/Saturation',
'ADBE ID MATTE':'ID Matte',
'ADBE ATG Extract':'Inner/Outer Key',
'ADBE Invert':'Invert',
'ADBE IRIS_WIPE':'Iris Wipe',
'ADBE KeyCleaner':'Key Cleaner',
'ADBE Leave Color':'Leave Color',
'ADBE Lens Flare':'Lens Flare',
'ADBE Easy Levels':'Levels',
'ADBE Easy Levels2':'Levels',
'ADBE Pro Levels2':'Levels (Individual Controls)',
'ADBE Pro Levels':'Levels (Individual Controls)',
'ADBE Lightning':'Lightning',
'ADBE Lightning 2':'Advanced Lightning',
'ADBE Linear Color Key2':'Linear Color Key',
'ADBE Linear Wipe':'Linear Wipe',
'ADBE LIQUIFY':'Liquify',
'ADBE Luma Key':'Luma Key',
'ADBE Lumetri':'Lumetri Color',
'ADBE Magnify':'Magnify',
'VISINF Grain Duplication':'Match Grain',
'ADBE Matte Choker':'Matte Choker',
'ADBE Median':'Median (Legacy)',
'ADBE Minimax':'Minimax',
'ADBE Mirror':'Mirror',
'ADBE Mosaic':'Mosaic',
'ADBE MESH WARP':'Mesh Warp',
'ADBE Noise2':'Noise',
'ADBE Noise':'Noise',
'ADBE Noise Alpha2':'Noise Alpha',
'ADBE Noise Alpha':'Noise Alpha',
'ADBE Noise HLS':'Noise HLS',
'ADBE Noise HLS2':'Noise HLS',
'ADBE Noise HLS Auto2':'Noise HLS Auto',
'ADBE Noise HLS Auto':'Noise HLS Auto',
'ADBE Numbers2':'Numbers',
'ADBE OCIO CDL Transform':'OCIO CDL Transform',
'ADBE OCIO Color Space Transform':'OCIO Color Space Transform',
'ADBE OCIO Display Transform':'OCIO Display Transform',
'ADBE OCIO FILE Transform':'OCIO File Transform',
'ADBE OCIO Look Transform':'OCIO Look Transform',
'ADBE Offset':'Offset',
'ADBE Optics Compensation':'Optics Compensation',
'ADBE Paint Bucket':'Paint Bucket',
'ADBE Playgnd':'Particle Playground',
'ADBE Path Text':'Path Text',
'ADBE Photo Filter':'Photo Filter',
'ADBE Polar Coordinates':'Polar Coordinates',
'ADBE Posterize':'Posterize',
'ADBE Posterize Time':'Posterize Time',
'ADBE ProfileToProfile':'Color Profile Converter',
'ADBE HDR ToneMap':'HDR Highlight Compression',
'ADBE PhotoFilterPS':'Photo Filter',
'ADBE SelectiveColor':'Selective Color',
'ADBE Vibrance':'Vibrance',
'ADBE Brightness & Contrast 2':'Brightness & Contrast',
'ADBE PS Median':'Median',
'ADBE Black&White':'Black & White',
'ADBE PSL Bevel Emboss':'Photoshop Bevel And Emboss',
'ADBE PSL Drop Shadow':'Photoshop Drop Shadow',
'ADBE PSL Inner Glow':'Photoshop Inner Glow',
'ADBE PSL Inner Shadow':'Photoshop Inner Shadow',
'ADBE PSL Outer Glow':'Photoshop Outer Glow',
'ADBE PSL Solid Fill':'Photoshop Solid Fill',
'ADBE PS Arbitrary Map':'PS Arbitrary Map',
'ADBE Radial Shadow':'Radial Shadow',
'ADBE Radial Blur':'Radial Blur',
'ADBE Radial Wipe':'Radial Wipe',
'APC Radio Waves':'Radio Waves',
'ADBE Ramp':'Gradient Ramp',
'VISINF Grain Removal':'Remove Grain',
'ADBE RESHAPE':'Reshape',
'ADBE Ripple':'Ripple',
'ADBE OFMotionBlur':'Pixel Motion Blur',
'ADBE Rolling Shutter':'Rolling Shutter Repair',
'ADBE Timewarp':'Timewarp',
'ADBE Roughen Edges':'Roughen Edges',
'ADBE Scatter':'Scatter',
'ADBE Scribble Fill':'Scribble',
'ADBE Set Channels':'Set Channels',
'ADBE Set Matte3':'Set Matte',
'ADBE Set Matte2':'Set Matte',
'ADBE ShadowHighlight':'Shadow/Highlight',
'ADBE Camera Lens Blur':'Camera Lens Blur',
'ADBE Sharpen':'Sharpen',
'APC Shatter':'Shatter',
'ADBE Shift Channels':'Shift Channels',
'ADBE Simple Choker':'Simple Choker',
'ADBE Smart Blur':'Smart Blur',
'ADBE SCHMEAR':'Smear',
'ADBE Solid Composite':'Solid Composite',
'ADBE Spherize':'Spherize',
'ADBE Spill Suppressor':'Spill Suppressor',
'ADBE Spill2':'Advanced Spill Suppressor',
'ADBE SubspaceStabilizer':'Warp Stabilizer',
'ADBE Strobe':'Strobe Light',
'ADBE Stroke':'Stroke',
'ADBE Texturize':'Texturize',
'ADBE Three-Way Color Corrector':'Three-Way Color Corrector',
'ADBE Threshold':'Threshold',
'ADBE Threshold2':'Threshold',
'ADBE Tile':'Motion Tile',
'ADBE Timecode':'Timecode',
'ADBE Time Displacement':'Time Displacement',
'ADBE Tint':'Tint',
'ADBE Geometry':'Transform',
'ADBE Geometry2':'Transform',
'ADBE Tritone':'Tritone',
'ADBE Turbulent Displace':'Turbulent Displace',
'ADBE AIF Perlin Noise 3D':'Turbulent Noise',
'ADBE Twirl':'Twirl',
'ADBE Remove Color Matting':'Remove Color Matting',
'ADBE Unsharp Mask2':'Unsharp Mask',
'ADBE Unsharp Mask':'Unsharp Mask',
'ADBE Upscale':'Detail-preserving Upscale',
'ADBE Vector Paint':'Vector Paint',
'APC Vegas':'Vegas',
'ADBE Venetian Blinds':'Venetian Blinds',
'ADBE DigitalVideoLimiter':'Video Limiter',
'Mettle SkyBox Chromatic Aberrat':'VR Chromatic Aberrations',
'Mettle SkyBox Color Gradients':'VR Color Gradients',
'Mettle SkyBox Converter':'VR Converter',
'Mettle SkyBox Denoise':'VR De-Noise',
'Mettle SkyBox Digital Glitch':'VR Digital Glitch',
'Mettle SkyBox Fractal Noise':'VR Fractal Noise',
'Mettle SkyBox Blur':'VR Blur',
'Mettle SkyBox Glow':'VR Glow',
'Mettle SkyBox Project 2D':'VR Plane to Sphere',
'Mettle SkyBox Rotate Sphere':'VR Rotate Sphere',
'Mettle SkyBox Sharpen':'VR Sharpen',
'Mettle SkyBox Viewer':'VR Sphere To Plane',
'APC Wave World':'Wave World',
'ADBE Wave Warp':'Wave Warp',
'ADBE Write-on':'Write-on',
'ADBE Samurai':'Roto Brush & Refine Edge',
'ADBE Paint':'Paint',
'ADBE FreePin3':'Puppet',
'ADBE RefineRBMatte':'Refine Hard Matte',
'ADBE RefineMatte':'Refine Matte',
'ADBE RefineMatte2':'Refine Soft Matte',
'ADBE Color Swirl':'Color Swirl',
'ADBE Getting Jiggy':'Getting Jiggy',
'ADBE Separate XYZ Position':'Separate XYZ Position',
'ADBE Separate XYZ Scale':'Separate XYZ Scale',
'ADBE CM InsetVideoFramed':'Inset Video - framed',
'ADBE CM InsetVideoTorn':'Inset Video - torn edges',
'ADBE CM MoodLightAmorph':'Mood Lighting - amorphous',
'ADBE CM MoodLightDigital':'Mood Lighting - digital',
'ADBE CM MoodLightStreaks':'Mood Lighting - streaks',
'ADBE CM CrackedTiles':'Cracked Tiles',
'ADBE CM LightLeaksMarkers':'Light Leaks - layer markers',
'ADBE CM LightLeaksRandom':'Light Leaks - random',
'ADBE CM OpacityFlashMarkers':'Opacity Flash - layer markers',
'ADBE CM OpacityFlashRandom':'Opacity Flash - random',
'ADBE CM CropEdges':'Crop Edges',
'ADBE CM AutoscrollHorizontal':'Autoscroll - horizontal',
'ADBE CM AutoscrollVertical':'Autoscroll - vertical',
'ADBE CM Throw':'Drift Over Time',
'ADBE CM FadeInOutFrames':'Fade In+Out - frames',
'ADBE CM FadeInOutmsec':'Fade In+Out - msec',
'ADBE CM Spin':'Rotate Over Time',
'ADBE CM ScaleBounceMarkers':'Scale Bounce - layer markers',
'ADBE CM ScaleBounceRandom':'Scale Bounce - random',
'ADBE CM WiggleGelatin':'Wiggle - gelatin',
'ADBE CM WigglePosition':'Wiggle - position',
'ADBE CM WiggleRotation':'Wiggle - rotation',
'ADBE CM WiggleScale':'Wiggle - scale',
'ADBE CM WiggleShear':'Wiggle - shear',
'ADBE CM Wigglerama':'Wigglerama',
'ADBE CM DissolveUnmelt':'Dissolve - unmelt',
'ADBE CM Zoom2DSpin':'Zoom - 2D spin',
'ADBE CM Zoom3DTumble':'Zoom - 3D tumble',
'ADBE CM ZoomWobble':'Zoom - wobble',
'ADBE CM ZoomBubble':'Zoom - bubble',
'ADBE CM ZoomSpiral':'Zoom - spiral',
'ADBE CM SlideVariable':'Slide - variable',
'ADBE CM FlyToInset':'Fly to Inset',
'ADBE CM CornerReveal':'Corner Reveal',
'ADBE CM GridWipe':'Grid Wipe',
'ADBE CM TransComplete':'Transition Master Control',
'ADBE CM TransStretch':'Stretch Master Control',
'ADBE CM TransDissolve':'Dissolve Master Control',
'ADBE CM TransFade':'Fade Master Control',
'ADBE CM TransFadeMask':'Mask Fade Controls',
'ADBE CM TransWipe':'Wipe Master Control',
'ADBE CM TransWipeFeath':'Wipe Master Controls',
'ADBE CM TransCard':'Card Wipe Master Control',
'ADBE CM TransSlide':'Slide Master Control',
'ADBE CM TransCorner':'Stretch Master Control(corner)',
'ADBE CM TransDirection':'Stretch Master Control (edge)',
'ADBE CM TransIris':'Iris Wipe Master Controls',
'ADBE CM TransRadial':'Radial Wipe Master Controls',
'ADBE DE Jiggle':'Jiggle',
'ADBE DE Jiggle At Marker':'Jiggle At Marker',
'ADBE DE Jiggle On Beat':'Jiggle On Beat',
'ADBE DE Jiggle Random':'Jiggle Random',
'ADBE DE Pulse':'Pulse',
'ADBE DE Pulse At Marker':'Pulse At Marker',
'ADBE DE Pulse On Beat':'Pulse On Beat',
'ADBE DE Pulse Random':'Pulse Random',
'ADBE DE Bounce':'Bounce',
'ADBE DE Bounce At Marker':'Bounce At Marker',
'ADBE DE Bounce On Beat':'Bounce On Beat',
'ADBE DE Bounce Random':'Bounce Random',
'ADBE DE Opacity Pulse':'Opacity Pulse',
'ADBE DE Opacity Pulse At Marker':'Opacity Pulse At Marker',
'ADBE DE Opacity Pulse On Beat':'Opacity Pulse On Beat',
'ADBE DE Opacity Pulse Random':'Opacity Pulse Random',
'ADBE DE Oscillate':'Oscillate',
'ADBE DE Oscillate At Marker':'Oscillate At Marker',
'ADBE DE Oscillate On Beat':'Oscillate On Beat',
'ADBE DE Oscillate Random':'Oscillate Random',
'ADBE DE Pendulum':'Pendulum',
'ADBE DE Pendulum At Marker':'Pendulum At Marker',
'ADBE DE Pendulum On Beat':'Pendulum On Beat',
'ADBE DE Pendulum Random':'Pendulum Random',
'ADBE DE Swarm':'Swarm',
'ADBE DE Follow':'Follow',
'ADBE DE Orbit':'Orbit',
'ADBE DE Orbit 3D':'Orbit 3D',
'ADBE DE Random Motion 1D':'Random Motion 1D',
'ADBE DE Random Motion':'Random Motion',
'ADBE DE Random Rotation':'Random Rotation',
'ADBE DE Random Rotation 3D':'Random Rotation 3D',
'ADBE DE Random Opacity':'Random Opacity',
'ADBE DE Random Scale':'Random Scale',
'ADBE DE Random Fill Color':'Random Fill Color',
'ADBE DE Z Spring':'Z Spring',
'ADBE DE Z Spring At Marker':'Z Spring At Marker',
'ADBE DE Wobble Bounce':'Wobble Bounce',
'ADBE DE Wobble Bounce At Marker':'Wobble Bounce At Marker',
'ADBE DE Wobble Bounce On Beat':'Wobble Bounce On Beat',
'ADBE DE Wobble Bounce Random':'Wobble Bounce Random',
'ADBE CM Animated Shape Control':'Animated Shape Control',
'ADBE CM Animated Shape 2':'Chaser Control',
'ADBE CM Animated Shape 3':'Animated Shape Control',
'ADBE Sample Image':'Sample Image',
'ADBE Stereo 3D Controls':'Stereo 3D Controls',
'Pseudo/ADBE Animal Head66':'Face Track Points',
'Pseudo/ADBE Animal Head14':'Face Measurements',
'Pseudo/ADBE Trace Path':'Trace Path',
'Pseudo/ADBE Pattern Template':'Pattern Template',
'Pseudo/ADBE Counter Controls':'Counter Controls',
'Pseudo/ADBE Currency Controls':'Currency Controls',
'Pseudo/ADBE Percentage Controls':'Percentage Controls',
'Pseudo/ADBE Timer Controls':'Timer Controls',
'Pseudo/ADBE 2D Text Box':'2D Text Box'
};
var g_debug = true;
var g_logLines = [];

function dbg(msg) {
    if (!g_debug) return;
    console.log('[WB]', msg);
    var ts = new Date();
    var time = ('0'+ts.getHours()).slice(-2) + ':' + ('0'+ts.getMinutes()).slice(-2) + ':' + ('0'+ts.getSeconds()).slice(-2);
    var line = time + ' ' + msg;
    g_logLines.push(line);
    var el = document.getElementById('debugLog');
    if (el) {
        var t = document.createElement('div');
        t.textContent = line;
        el.appendChild(t);
        el.scrollTop = el.scrollHeight;
        // Auto-expand log body
        var body = document.getElementById('debugLogBody');
        var hdr = document.querySelector('[data-target="debugLogBody"]');
        if (body && body.classList.contains('collapsed')) {
            body.classList.remove('collapsed');
            if (hdr) hdr.classList.remove('collapsed');
        }
    }
}

var LANG = [
    { title:'WB Menu Suite', save:'Save', record:'Record', trigger:'Trigger',
      winAlpha:'Win Opacity', bgAlpha:'Bg Alpha', bgColor:'Bg Color', glowColor:'Glow Color',
      glowIntensity:'Glow Intensity', imgDist:'Icon Dist', textDist:'Text Dist',
      textSize:'Text Size', menuScale:'Menu Scale',
       pieCount:'Pie Sectors', quickCount:'Quick Slots',
       pieMenu:'Pie Menu', cep:'CEP Panel',
       numpad:'Numpad', about:'About',
      numpadHint:'F13-F22 (requires pairing)',
      pie:'Pie', quick:'Quick', wheel:'Wheel',
      sName:'Name', sEffect:'Effect', sImage:'Image', sSize:'Size',
      page:'Page', dblClick:'DblClick=Search', escClose:'Esc=Close',
      saveOk:'Saved!', saveFail:'Save failed',
      browse:'Browse', searchPH:'Search effects...', recordPH:'Record...',
      prevPage:'Prev Page', nextPage:'Next Page', pageColor:'Page Color',
       menu:'Menu', guide:'Guide Line', guideHint:'Line from center to cursor',
       width:'Width', color:'Color', uiZoom:'UI Zoom',
      selectMode:'Select Mode', clickSelect:'Click', holdSelect:'Hold+Release',
      infinite:'Infinite', wheelCount:'Wheel Slots',
      config:'Config', presets:'Presets',
      savePreset:'Save Preset', loadPreset:'Load Preset' },
    { title:'WB 菜单套件', save:'保存', record:'录制', trigger:'快捷键',
      winAlpha:'窗口透明', bgAlpha:'背景透明', bgColor:'背景色', glowColor:'辉光色',
      glowIntensity:'辉光强度', imgDist:'图标距离', textDist:'文字距离',
       textSize:'文字大小', menuScale:'菜单缩放',
         pieCount:'饼图扇区', quickCount:'快捷槽位',
       pieMenu:'Pie菜单', cep:'CEP面板',
        numpad:'数字键盘', about:'关于',
      numpadHint:'F13-F22（需配对）',
      pie:'饼形', quick:'快速', wheel:'滚轮',
      sName:'名称', sEffect:'效果', sImage:'图片', sSize:'大小',
      page:'页', dblClick:'双击=搜索', escClose:'Esc=关闭',
      saveOk:'已保存！', saveFail:'保存失败',
      browse:'浏览', searchPH:'搜索效果...', recordPH:'录制...',
      prevPage:'上一页', nextPage:'下一页', pageColor:'页码颜色',
      menu:'菜单', guide:'指引线', guideHint:'从圆心指向鼠标',
      width:'粗细', color:'颜色', uiZoom:'面板缩放',
      selectMode:'选择模式', clickSelect:'点击', holdSelect:'按住松手',
      infinite:'无限轮盘', wheelCount:'轮盘槽位',
      config:'配置', presets:'预设',
      savePreset:'保存预设', loadPreset:'加载预设' }
];

function setLanguage() {
    var l = LANG[language] || LANG[0];
    document.querySelectorAll('[data-lang]').forEach(function(el) {
        var key = el.getAttribute('data-lang');
        if (l[key]) {
            if (el.tagName === 'INPUT' && el.type === 'text') el.placeholder = l[key];
            else el.textContent = l[key];
        }
    });
    document.getElementById('triggerInput').placeholder = l.recordPH;
}

var items = [];
for (var m = 0; m < 4; m++) {
    items[m] = [];
    for (var p = 0; p < PAGES; p++) {
        items[m][p] = [];
        for (var i = 0; i < MAX; i++)
            items[m][p][i] = { name: '', effect: '', effectDisplay: '', image: '', size: 80, slotKey: 0, slotMod: 0 };
    }
}

var infEffects = [
    {name:'CC Glass',match:'ADBE CC Glass'},{name:'Curves',match:'ADBE Curves Custom'},{name:'Glow',match:'ADBE Glow2'},
    {name:'Drop Shadow',match:'ADBE Drop Shadow'},{name:'Levels',match:'ADBE Levels'},{name:'Hue/Saturation',match:'ADBE Hue Saturation'},
    {name:'Blur (Gaussian)',match:'ADBE Gaussian Blur'},{name:'Directional Blur',match:'ADBE Directional Blur'},
    {name:'Radial Blur',match:'ADBE Radial Blur'},{name:'Fractal Noise',match:'ADBE Fractal Noise'},
    {name:'Lumetri Color',match:'ADBE Lumetri Color'},{name:'Colorama',match:'ADBE Colorama'},
    {name:'S_Glow',match:'Sapphire Glow'},{name:'S_Shake',match:'Sapphire Shake'},{name:'S_WarpBubble',match:'Sapphire WarpBubble'},
    {name:'S_LensFlare',match:'Sapphire LensFlare'},{name:'S_Rays',match:'Sapphire Rays'},{name:'S_Glint',match:'Sapphire Glint'},
    {name:'S_HeatDisplacement',match:'Sapphire HeatDisplacement'},{name:'S_KnollLight',match:'Sapphire KnollLight'},
    {name:'S_Zap',match:'Sapphire Zap'},{name:'S_GlowRain',match:'Sapphire GlowRain'},{name:'S_EdgeRays',match:'Sapphire EdgeRays'},
    {name:'S_WarpPuddle',match:'Sapphire WarpPuddle'},{name:'S_WarpRipple',match:'Sapphire WarpRipple'}
];
var infRecentEffects = [];
var infEditedSlot = -1;
var infRecording = false;
var g_infEffectSearch = false;

var csInterface = null;
try { csInterface = new CSInterface(); } catch(e) {}

function applyInfLayoutToDOM() {
    var s = window._infLayoutSettings;
    if (!s) return;
    var el = document.getElementById('infSectors');
    if (el) el.value = s.sectors;
    el = document.getElementById('infSplitR2');
    if (el) el.value = s.splitR2;
    el = document.getElementById('infSplitR3');
    if (el) el.value = s.splitR3;
    el = document.getElementById('infRDz');
    if (el) { el.value = s.rDead; var v = document.getElementById('infRDzV'); if (v) v.textContent = s.rDead; }
    el = document.getElementById('infR1');
    if (el) { el.value = s.r1; var v = document.getElementById('infR1V'); if (v) v.textContent = s.r1; }
    el = document.getElementById('infR2');
    if (el) { el.value = s.r2; var v = document.getElementById('infR2V'); if (v) v.textContent = s.r2; }
    // Restore sector colors
    if (window._infSectorColors) {
        for (var si = 0; si < 8; si++) {
            var sw = document.getElementById('infSwatch_' + si);
            if (sw) sw.style.background = window._infSectorColors[si];
        }
    }
}


function evalScript(code) {
    return new Promise(function(resolve) {
        if (csInterface) csInterface.evalScript(code, function(r) { resolve(r); });
        else resolve('');
    });
}

function parseSettings(data) {
    var parsed = {};
    var lines = data.split('\n');
    lines.forEach(function(line) {
        var idx = line.indexOf('=');
        if (idx > 0) parsed[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
    });
    if (parsed['trigger_key']) triggerKey = parseInt(parsed['trigger_key']) || 32;
    if (parsed['trigger_mod']) triggerMod = parseInt(parsed['trigger_mod']) || 6;
    if (parsed['prev_page_key']) prevPageKey = parseInt(parsed['prev_page_key']) || 90;
    if (parsed['next_page_key']) nextPageKey = parseInt(parsed['next_page_key']) || 88;
    if (parsed['win_alpha']) winAlpha = parseInt(parsed['win_alpha']) || 60;
        if (parsed['pie_bg_alpha']) bgAlpha[0] = parseInt(parsed['pie_bg_alpha']) || 100;
    if (parsed['quick_bg_alpha']) bgAlpha[1] = parseInt(parsed['quick_bg_alpha']) || 100;
    if (parsed['wheel_bg_alpha']) bgAlpha[2] = parseInt(parsed['wheel_bg_alpha']) || 100;
    if (parsed['infinite_bg_alpha']) bgAlpha[3] = parseInt(parsed['infinite_bg_alpha']) || 100;
    if (parsed['bg_alpha']) { var v = parseInt(parsed['bg_alpha']) || 100; for (var zz=0;zz<4;zz++) bgAlpha[zz] = v; }
        if (parsed['pie_bg_color']) bgColor[0] = parsed['pie_bg_color'];
    if (parsed['quick_bg_color']) bgColor[1] = parsed['quick_bg_color'];
    if (parsed['wheel_bg_color']) bgColor[2] = parsed['wheel_bg_color'];
    if (parsed['infinite_bg_color']) bgColor[3] = parsed['infinite_bg_color'];
    if (parsed['bg_color']) { var v = parsed['bg_color']; for (var zz=0;zz<4;zz++) bgColor[zz] = v; }
        if (parsed['pie_glow_color']) glowColor[0] = parsed['pie_glow_color'];
    if (parsed['quick_glow_color']) glowColor[1] = parsed['quick_glow_color'];
    if (parsed['wheel_glow_color']) glowColor[2] = parsed['wheel_glow_color'];
    if (parsed['infinite_glow_color']) glowColor[3] = parsed['infinite_glow_color'];
    if (parsed['glow_color']) { var v = parsed['glow_color']; for (var zz=0;zz<4;zz++) glowColor[zz] = v; }
        if (parsed['pie_glow_intensity']) glowIntensity[0] = parseInt(parsed['pie_glow_intensity']) || 100;
    if (parsed['quick_glow_intensity']) glowIntensity[1] = parseInt(parsed['quick_glow_intensity']) || 100;
    if (parsed['wheel_glow_intensity']) glowIntensity[2] = parseInt(parsed['wheel_glow_intensity']) || 100;
    if (parsed['infinite_glow_intensity']) glowIntensity[3] = parseInt(parsed['infinite_glow_intensity']) || 100;
    if (parsed['glow_intensity']) { var v = parseInt(parsed['glow_intensity']) || 100; for (var zz=0;zz<4;zz++) glowIntensity[zz] = v; }
        if (parsed['pie_page_color']) pageColor[0] = parsed['pie_page_color'];
    if (parsed['quick_page_color']) pageColor[1] = parsed['quick_page_color'];
    if (parsed['wheel_page_color']) pageColor[2] = parsed['wheel_page_color'];
    if (parsed['infinite_page_color']) pageColor[3] = parsed['infinite_page_color'];
    if (parsed['page_color']) { var v = parsed['page_color']; for (var zz=0;zz<4;zz++) pageColor[zz] = v; }
        if (parsed['pie_img_dist']) imgDist[0] = parseInt(parsed['pie_img_dist']) || 100;
    if (parsed['quick_img_dist']) imgDist[1] = parseInt(parsed['quick_img_dist']) || 100;
    if (parsed['wheel_img_dist']) imgDist[2] = parseInt(parsed['wheel_img_dist']) || 100;
    if (parsed['infinite_img_dist']) imgDist[3] = parseInt(parsed['infinite_img_dist']) || 100;
    if (parsed['img_dist']) { var v = parseInt(parsed['img_dist']) || 100; for (var zz=0;zz<4;zz++) imgDist[zz] = v; }
        if (parsed['pie_text_dist']) textDist[0] = parseInt(parsed['pie_text_dist']) || 100;
    if (parsed['quick_text_dist']) textDist[1] = parseInt(parsed['quick_text_dist']) || 100;
    if (parsed['wheel_text_dist']) textDist[2] = parseInt(parsed['wheel_text_dist']) || 100;
    if (parsed['infinite_text_dist']) textDist[3] = parseInt(parsed['infinite_text_dist']) || 100;
    if (parsed['text_dist']) { var v = parseInt(parsed['text_dist']) || 100; for (var zz=0;zz<4;zz++) textDist[zz] = v; }
        if (parsed['pie_text_size']) textSize[0] = parseInt(parsed['pie_text_size']) || 100;
    if (parsed['quick_text_size']) textSize[1] = parseInt(parsed['quick_text_size']) || 100;
    if (parsed['wheel_text_size']) textSize[2] = parseInt(parsed['wheel_text_size']) || 100;
    if (parsed['infinite_text_size']) textSize[3] = parseInt(parsed['infinite_text_size']) || 100;
    if (parsed['text_size']) { var v = parseInt(parsed['text_size']) || 100; for (var zz=0;zz<4;zz++) textSize[zz] = v; }
        if (parsed['pie_ui_zoom']) uiZoom[0] = parseInt(parsed['pie_ui_zoom']) || 100;
    if (parsed['quick_ui_zoom']) uiZoom[1] = parseInt(parsed['quick_ui_zoom']) || 100;
    if (parsed['wheel_ui_zoom']) uiZoom[2] = parseInt(parsed['wheel_ui_zoom']) || 100;
    if (parsed['infinite_ui_zoom']) uiZoom[3] = parseInt(parsed['infinite_ui_zoom']) || 100;
    if (parsed['ui_zoom']) { var v = parseInt(parsed['ui_zoom']) || 100; for (var zz=0;zz<4;zz++) uiZoom[zz] = v; }
        if (parsed['pie_menu_scale']) menuScale[0] = parseInt(parsed['pie_menu_scale']) || 100;
    if (parsed['quick_menu_scale']) menuScale[1] = parseInt(parsed['quick_menu_scale']) || 100;
    if (parsed['wheel_menu_scale']) menuScale[2] = parseInt(parsed['wheel_menu_scale']) || 100;
    if (parsed['infinite_menu_scale']) menuScale[3] = parseInt(parsed['infinite_menu_scale']) || 100;
    if (parsed['menu_scale']) { var v = parseInt(parsed['menu_scale']) || 100; for (var zz=0;zz<4;zz++) menuScale[zz] = v; }
    if (parsed['language']) language = parseInt(parsed['language']) || 0;
    if (parsed['numpad_enabled']) numpadEnabled = parsed['numpad_enabled'] === '1';
    if (parsed['select_mode']) selectMode = parseInt(parsed['select_mode']) || 0;
    if (parsed['guide_enabled']) guideEnabled = parsed['guide_enabled'] === '1';
    if (parsed['guide_color']) guideColor = parsed['guide_color'];
    if (parsed['guide_width']) guideWidth = parseInt(parsed['guide_width']) || 2;
    if (parsed['menu_type']) curMenu = parseInt(parsed['menu_type']) || 0;
    if (parsed['pie_count']) pieCount = Math.min(Math.max(parseInt(parsed['pie_count'])||4,2),8);
    if (parsed['quick_count']) quickCount = Math.min(Math.max(parseInt(parsed['quick_count'])||6,1),9);
    if (parsed['wheel_count']) infiniteCount = parseInt(parsed['wheel_count']) || 8;
    if (parsed['item_count']) pieCount = Math.min(Math.max(parseInt(parsed['item_count'])||4,2),8);

    // Load infinite layout settings
    window._infLayoutSettings = {
        sectors: parsed['infinite_sectors'] ? Math.min(Math.max(parseInt(parsed['infinite_sectors'])||8,2),8) : 8,
        splitR2: parsed['infinite_split_R2'] || '2a',
        splitR3: parsed['infinite_split_R3'] || '3',
        rDead: parsed['infinite_rDead'] ? Math.min(Math.max(parseInt(parsed['infinite_rDead'])||20,6),45) : 20,
        r1: parsed['infinite_r1'] ? Math.min(Math.max(parseInt(parsed['infinite_r1'])||80,30),130) : 80,
        r2: parsed['infinite_r2'] ? Math.min(Math.max(parseInt(parsed['infinite_r2'])||140,60),165) : 140
    };
    if (!window._infSectorColors || window._infLayoutSettings) window._infSectorColors = ['#3a6a3a','#6a5a3a','#3a5a7a','#6a3a5a','#5a5a3a','#3a6a5a','#5a3a6a','#6a4a3a'];
    for (var sic = 0; sic < 8; sic++) {
        if (parsed['infinite_sector_' + sic + '_color'])
            window._infSectorColors[sic] = '#' + parsed['infinite_sector_' + sic + '_color'];
    }

    // Load infinite slot data
    window._infSlotData = [];
    for (var si4 = 0; si4 < 200; si4++) {
        var sp = 'infinite_0_' + si4 + '_';
        if (parsed[sp + 'n'] || parsed[sp + 'e'] || parsed[sp + 'img']) {
            window._infSlotData[si4] = {
                name: parsed[sp + 'n'] || '',
                effect: parsed[sp + 'e'] || '',
                key: parsed[sp + 'key'] || '',
                icon: parsed[sp + 'img'] || '',
                font: parseInt(parsed[sp + 'sz']) || 100,
                action: parseInt(parsed[sp + 'act']) || 0
            };
        }
    }

    for (var i = 0; i < MAX; i++) {
        if (parsed['n' + i] && !parsed['pie_0_' + i + '_n']) items[0][0][i].name = parsed['n' + i];
        if (parsed['n' + i + '_effect'] && !parsed['pie_0_' + i + '_e']) items[0][0][i].effect = parsed['n' + i + '_effect'];
        if (parsed['n' + i + '_image'] && !parsed['pie_0_' + i + '_img']) items[0][0][i].image = parsed['n' + i + '_image'];
        if (parsed['n' + i + '_image_hover'] && !parsed['pie_0_' + i + '_imgh']) items[0][0][i].imageHover = parsed['n' + i + '_image_hover'];
    }

    for (var m = 0; m < 3; m++) {
        for (var p = 0; p < PAGES; p++) {
            for (var i = 0; i < MAX; i++) {
                var pref = labelMap[m].toLowerCase() + '_' + p + '_' + i;
                if (parsed[pref + '_n']) items[m][p][i].name = parsed[pref + '_n'];
                if (parsed[pref + '_e']) items[m][p][i].effect = parsed[pref + '_e'];
                if (parsed[pref + '_en']) items[m][p][i].effectDisplay = parsed[pref + '_en'];
                if (parsed[pref + '_img']) items[m][p][i].image = parsed[pref + '_img'];
                if (parsed[pref + '_sz']) items[m][p][i].size = parseInt(parsed[pref + '_sz']) || 80;
                if (parsed[pref + '_key']) items[m][p][i].slotKey = parseInt(parsed[pref + '_key']);
                if (parsed[pref + '_mod']) items[m][p][i].slotMod = parseInt(parsed[pref + '_mod']);
            }
        }
    }
}

function loadSettings() {
    evalScript('readSettings()').then(function(data) {
        if (data) parseSettings(data);
        updateAll();
        try { var r = localStorage.getItem('wb_recent_effects'); if (r) g_recentEffects = JSON.parse(r); } catch(e) {}
    });
}

function saveRecentEffects() {
    try { localStorage.setItem('wb_recent_effects', JSON.stringify(g_recentEffects)); } catch(e) {}
}

function saveSettings() {
    collectFromUI();
    g_settingsVersion++;
    var lines = ['settings_version=' + g_settingsVersion,
                 'trigger_key=' + triggerKey, 'trigger_mod=' + triggerMod,
                 'prev_page_key=' + prevPageKey, 'next_page_key=' + nextPageKey,
                 'win_alpha=' + winAlpha, 'pie_bg_alpha=' + bgAlpha[0] + '\nquick_bg_alpha=' + bgAlpha[1] + '\nwheel_bg_alpha=' + bgAlpha[2] + '\ninfinite_bg_alpha=' + bgAlpha[3], 'pie_bg_color=' + bgColor[0] + '\nquick_bg_color=' + bgColor[1] + '\nwheel_bg_color=' + bgColor[2] + '\ninfinite_bg_color=' + bgColor[3],
                 'pie_glow_color=' + glowColor[0] + '\nquick_glow_color=' + glowColor[1] + '\nwheel_glow_color=' + glowColor[2] + '\ninfinite_glow_color=' + glowColor[3], 'pie_glow_intensity=' + glowIntensity[0] + '\nquick_glow_intensity=' + glowIntensity[1] + '\nwheel_glow_intensity=' + glowIntensity[2] + '\ninfinite_glow_intensity=' + glowIntensity[3],
                 'pie_page_color=' + pageColor[0] + '\nquick_page_color=' + pageColor[1] + '\nwheel_page_color=' + pageColor[2] + '\ninfinite_page_color=' + pageColor[3],
                 'pie_img_dist=' + imgDist[0] + '\nquick_img_dist=' + imgDist[1] + '\nwheel_img_dist=' + imgDist[2] + '\ninfinite_img_dist=' + imgDist[3], 'pie_text_dist=' + textDist[0] + '\nquick_text_dist=' + textDist[1] + '\nwheel_text_dist=' + textDist[2] + '\ninfinite_text_dist=' + textDist[3], 'pie_text_size=' + textSize[0] + '\nquick_text_size=' + textSize[1] + '\nwheel_text_size=' + textSize[2] + '\ninfinite_text_size=' + textSize[3],
                  'pie_ui_zoom=' + uiZoom[0] + '\nquick_ui_zoom=' + uiZoom[1] + '\nwheel_ui_zoom=' + uiZoom[2] + '\ninfinite_ui_zoom=' + uiZoom[3], 'pie_menu_scale=' + menuScale[0] + '\nquick_menu_scale=' + menuScale[1] + '\nwheel_menu_scale=' + menuScale[2] + '\ninfinite_menu_scale=' + menuScale[3], 'language=' + language,
                 'numpad_enabled=' + (numpadEnabled?'1':'0'),
                 'guide_enabled=' + (guideEnabled?'1':'0'), 'guide_color=' + guideColor, 'guide_width=' + guideWidth,
                 'wheel_count=' + infiniteCount,
                 'select_mode=' + selectMode,
                 'menu_type=' + curMenu, 'pie_count=' + pieCount, 'quick_count=' + quickCount,
                 'infinite_sectors=' + ((document.getElementById('infSectors')||{}).value || 8),
                 'infinite_split_R2=' + ((document.getElementById('infSplitR2')||{}).value || '2a'),
                 'infinite_split_R3=' + ((document.getElementById('infSplitR3')||{}).value || 3),
                 'infinite_rDead=' + ((document.getElementById('infRDz')||{}).value || 20),
                 'infinite_r1=' + ((document.getElementById('infR1')||{}).value || 80),
                 'infinite_r2=' + ((document.getElementById('infR2')||{}).value || 140)];
    for (var si = 0; si < 8; si++) {
        if (window._infSectorColors && window._infSectorColors[si])
            lines.push('infinite_sector_' + si + '_color=' + window._infSectorColors[si].replace('#',''));
    }
    // Persist infinite slot data
    if (window._infSlotData) {
        for (var si3 = 0; si3 < window._infSlotData.length; si3++) {
            var sd = window._infSlotData[si3];
            if (!sd || (!sd.name && !sd.effect && !sd.icon)) continue;
            var sp = 'infinite_0_' + si3 + '_';
            if (sd.name) lines.push(sp + 'n=' + sd.name);
            if (sd.effect) lines.push(sp + 'e=' + sd.effect);
            if (sd.icon) lines.push(sp + 'img=' + sd.icon);
            if (sd.key) lines.push(sp + 'key=' + sd.key);
            if (sd.font && sd.font !== 100) lines.push(sp + 'sz=' + sd.font);
            if (sd.action) lines.push(sp + 'act=' + sd.action);
        }
    }
    for (var m = 0; m < 3; m++) {
        var count = (m === 0) ? pieCount : (m === 1) ? quickCount : 8;
        for (var p = 0; p < PAGES; p++) {
            for (var i = 0; i < count; i++) {
                var pref = labelMap[m].toLowerCase() + '_' + p + '_' + i;
                if (items[m][p][i].name) lines.push(pref + '_n=' + items[m][p][i].name);
                if (items[m][p][i].effect) {
                    dbg('save slot [' + m + '][' + p + '][' + i + '] effect="' + items[m][p][i].effect + '" display="' + (items[m][p][i].effectDisplay||'') + '"');
                    lines.push(pref + '_e=' + items[m][p][i].effect);
                }
                if (items[m][p][i].effectDisplay) lines.push(pref + '_en=' + items[m][p][i].effectDisplay);
                if (items[m][p][i].image) lines.push(pref + '_img=' + items[m][p][i].image);
                if (items[m][p][i].size && items[m][p][i].size !== 80) lines.push(pref + '_sz=' + items[m][p][i].size);
                if (items[m][p][i].slotKey) lines.push(pref + '_key=' + items[m][p][i].slotKey);
                if (items[m][p][i].slotMod) lines.push(pref + '_mod=' + items[m][p][i].slotMod);
            }
        }
    }
    var l = LANG[language] || LANG[0];
    evalScript('writeSettings(' + JSON.stringify(lines.join('\n')) + ')').then(function(r) {
        var s = document.getElementById('status');
        if (r === 'OK') { s.className = 'success'; s.textContent = l.saveOk; setTimeout(function(){s.textContent='';},3000); }
        else { s.className = 'error'; s.textContent = l.saveFail; }
    });
}

function triggerAutoSave() {
    dbg('triggerAutoSave');
    if (g_saveTimer) clearTimeout(g_saveTimer);
    g_saveTimer = setTimeout(function() {
        dbg('autoSave firing');
        saveSettings();
    }, 250);
}

function collectFromUI() {
    var s = document.getElementById('winAlphaSlider');
    if (s) winAlpha = parseInt(s.value) || 60;
    var slv = document.getElementById('winAlphaValue');
    if (slv) slv.textContent = winAlpha;
    var ba = document.getElementById('bgAlphaSlider');
    if (ba) bgAlpha[curMenu] = parseInt(ba.value) || 60;
    var bav = document.getElementById('bgAlphaValue');
    if (bav) bav.textContent = bgAlpha[curMenu];
    var nt = document.getElementById('numpadToggle');
    if (nt) numpadEnabled = nt.checked;
    var sm0 = document.getElementById('selectMode0');
    var sm1 = document.getElementById('selectMode1');
    if (sm0 && sm1) selectMode = sm1.checked ? 1 : 0;
    var wcs = document.getElementById('wheelCountSelect');
    if (wcs) infiniteCount = parseInt(wcs.value) || 8;
    var bc = document.getElementById('bgColorInput');
    if (bc) bgColor[curMenu] = bc.value.replace('#', '').toLowerCase();
    var bct = document.getElementById('bgColorText');
    if (bct) bct.textContent = '#' + bgColor[curMenu].toUpperCase();
    var gt = document.getElementById('guideToggle');
    if (gt) guideEnabled = gt.checked;
    var gw = document.getElementById('guideWidthSlider');
    if (gw) guideWidth = parseInt(gw.value) || 2;
    var gwv = document.getElementById('guideWidthValue');
    if (gwv) gwv.textContent = guideWidth;
    var gdc = document.getElementById('guideColorInput');
    if (gdc) guideColor = gdc.value.replace('#', '').toLowerCase();
    var gdct = document.getElementById('guideColorText');
    if (gdct) gdct.textContent = '#' + guideColor.toUpperCase();
    var gc = document.getElementById('glowColorInput');
    if (gc) glowColor[curMenu] = gc.value.replace('#', '').toLowerCase();
    var gct = document.getElementById('glowColorText');
    if (gct) gct.textContent = '#' + glowColor[curMenu].toUpperCase();
    var pgc = document.getElementById('pageColorInput');
    if (pgc) pageColor[curMenu] = pgc.value.replace('#', '').toLowerCase();
    var pgct = document.getElementById('pageColorText');
    if (pgct) pgct.textContent = '#' + pageColor[curMenu].toUpperCase();
    var gi = document.getElementById('glowIntensitySlider');
    if (gi) glowIntensity[curMenu] = parseInt(gi.value) || 100;
    var giv = document.getElementById('glowIntensityValue');
    if (giv) giv.textContent = glowIntensity[curMenu];
    var id = document.getElementById('imgDistSlider');
    if (id) imgDist[curMenu] = parseInt(id.value) || 45;
    var idv = document.getElementById('imgDistValue');
    if (idv) idv.textContent = imgDist[curMenu];
    var td = document.getElementById('textDistSlider');
    if (td) textDist[curMenu] = parseInt(td.value) || 85;
    var tdv = document.getElementById('textDistValue');
    if (tdv) tdv.textContent = textDist[curMenu];
    var ts = document.getElementById('textSizeSlider');
    if (ts) textSize[curMenu] = parseInt(ts.value) || 100;
    var tsv = document.getElementById('textSizeValue');
    if (tsv) tsv.textContent = textSize[curMenu] + '%';
    var uz = document.getElementById('uiZoomSlider');
    if (uz) uiZoom[curMenu] = parseInt(uz.value) || 100;
    var uzv = document.getElementById('uiZoomValue');
    if (uzv) uzv.textContent = uiZoom[curMenu];
    var ms = document.getElementById('menuScaleSlider');
    if (ms) menuScale[curMenu] = parseInt(ms.value) || 100;
    var msv = document.getElementById('menuScaleValue');
    if (msv) msv.textContent = menuScale[curMenu];
    var count = (curMenu === 0) ? pieCount : (curMenu === 1) ? quickCount : 8;
    for (var i = 0; i < count; i++) {
        var el = document.getElementById('itemName_' + i);
        if (el) items[curMenu][curPage][i].name = el.value;
        el = document.getElementById('itemImage_' + i);
        if (el) items[curMenu][curPage][i].image = el.value;
        el = document.getElementById('itemSize_' + i);
        if (el) items[curMenu][curPage][i].size = parseInt(el.value) || 80;
    }
}

function switchMenu(m) {
    collectFromUI();
    curMenu = m; curPage = 0;
    updateAll();
    if (m === 0 || m === 3) { saveSettings(); }
}

function switchPage(p) {
    collectFromUI();
    curPage = p;
    renderMenu();
    updateMenuHeader();
    updatePageTabs();
}

function updateAll() {
    updateTabs();
    updateMenuHeader();
    updatePageTabs();
    renderMenu();
    updateTriggerDisplay();
    updatePageKeyDisplay();
    updateGlobals();
    setLanguage();
}

function updateTabs() {
    var btns = document.querySelectorAll('#menuTabs .tab');
    btns.forEach(function(b) { b.classList.toggle('active', parseInt(b.dataset.menu) === curMenu); });
}

function updateMenuHeader() {
    var h = document.getElementById('menuHeader');
    var count = (curMenu === 0) ? pieCount : (curMenu === 1) ? quickCount : 8;
    var l = LANG[language] || LANG[0];
    var label = (l[['pie','quick','wheel','infinite'][curMenu]] || labelMap[curMenu]) + ' ' + (l.menu || 'Menu');
    var pageLabel = l.page + ' ' + (curPage + 1) + '/' + PAGES;
    h.innerHTML = '<strong>' + label + '</strong> &nbsp; <span class="hint">' + pageLabel + '</span>';
    var ml = document.getElementById('currentMenuLabel');
    if (ml) ml.textContent = ['Pie','Quick','Wheel','Infinite'][curMenu] || 'Pie';
}

function updatePageTabs() {
    // remove old page tabs
    var old = document.querySelectorAll('.page-tab');
    old.forEach(function(el) { el.remove(); });
    var header = document.getElementById('menuHeader');
    for (var p = 0; p < PAGES; p++) {
        var btn = document.createElement('button');
        btn.className = 'page-tab' + (p === curPage ? ' active' : '');
        btn.textContent = p + 1;
        btn.dataset.page = p;
        btn.addEventListener('click', function() { switchPage(parseInt(this.dataset.page)); });
        header.appendChild(btn);
    }
}

function updateGlobals() {
    var s = document.getElementById('winAlphaSlider');
    if (s) s.value = winAlpha;
    var slv = document.getElementById('winAlphaValue');
    if (slv) slv.textContent = winAlpha;
    var ba = document.getElementById('bgAlphaSlider');
    if (ba) ba.value = bgAlpha[curMenu];
    var bav = document.getElementById('bgAlphaValue');
    if (bav) bav.textContent = bgAlpha[curMenu];
    var bc = document.getElementById('bgColorInput');
    if (bc) bc.value = '#' + bgColor[curMenu];
    var bct = document.getElementById('bgColorText');
    if (bct) bct.textContent = '#' + bgColor[curMenu].toUpperCase();
    var gc = document.getElementById('glowColorInput');
    if (gc) gc.value = '#' + glowColor[curMenu];
    var gct = document.getElementById('glowColorText');
    if (gct) gct.textContent = '#' + glowColor[curMenu].toUpperCase();
    var pgc = document.getElementById('pageColorInput');
    if (pgc) pgc.value = '#' + pageColor[curMenu];
    var pgct = document.getElementById('pageColorText');
    if (pgct) pgct.textContent = '#' + pageColor[curMenu].toUpperCase();
    var gi = document.getElementById('glowIntensitySlider');
    if (gi) gi.value = glowIntensity[curMenu];
    var giv = document.getElementById('glowIntensityValue');
    if (giv) giv.textContent = glowIntensity[curMenu];
    var id = document.getElementById('imgDistSlider');
    if (id) id.value = imgDist[curMenu];
    var idv = document.getElementById('imgDistValue');
    if (idv) idv.textContent = imgDist[curMenu];
    var td = document.getElementById('textDistSlider');
    if (td) td.value = textDist[curMenu];
    var tdv = document.getElementById('textDistValue');
    if (tdv) tdv.textContent = textDist[curMenu];
    var ts = document.getElementById('textSizeSlider');
    if (ts) ts.value = textSize[curMenu];
    var tsv = document.getElementById('textSizeValue');
    if (tsv) tsv.textContent = textSize[curMenu] + '%';
    var uz = document.getElementById('uiZoomSlider');
    if (uz) uz.value = uiZoom[curMenu];
    var uzv = document.getElementById('uiZoomValue');
    if (uzv) uzv.textContent = uiZoom[curMenu];
    var zc = document.getElementById('zoomContent');
    if (zc) zc.style.zoom = (uiZoom[curMenu] / 100).toFixed(2);
    var ms = document.getElementById('menuScaleSlider');
    if (ms) ms.value = menuScale[curMenu];
    var msv = document.getElementById('menuScaleValue');
    if (msv) msv.textContent = menuScale[curMenu] + '%';
    var pc = document.getElementById('pieCountSelect');
    if (pc) pieCount = parseInt(pc.value) || 4;
    var qc = document.getElementById('quickCountSelect');
    if (qc) quickCount = parseInt(qc.value) || 6;
    var nt = document.getElementById('numpadToggle');
    if (nt) nt.checked = numpadEnabled;
    var wcs = document.getElementById('wheelCountSelect');
    if (wcs) wcs.value = infiniteCount;
    var sm0 = document.getElementById('selectMode0');
    var sm1 = document.getElementById('selectMode1');
    if (sm0 && sm1) { sm0.checked = (selectMode === 0); sm1.checked = (selectMode === 1); }
    var gt = document.getElementById('guideToggle');
    if (gt) gt.checked = guideEnabled;
    var gw = document.getElementById('guideWidthSlider');
    if (gw) gw.value = guideWidth;
    var gwv = document.getElementById('guideWidthValue');
    if (gwv) gwv.textContent = guideWidth;
    var gdc = document.getElementById('guideColorInput');
    if (gdc) gdc.value = '#' + guideColor;
    var gdct = document.getElementById('guideColorText');
    if (gdct) gdct.textContent = '#' + guideColor.toUpperCase();
    var pc = document.getElementById('pieCountSelect');
    if (pc) pc.value = '' + pieCount;
    var qc = document.getElementById('quickCountSelect');
    if (qc) qc.value = '' + quickCount;
  }

function renderMenu() {
    dbg('renderMenu start: curMenu=' + curMenu + ' curPage=' + curPage + ' pieCount=' + pieCount + ' quickCount=' + quickCount);
    var zc = document.getElementById('zoomContent');
    var savedScroll = zc ? zc.scrollTop : 0;
    var container = document.getElementById('itemsContainer');
    if (!container) { dbg('  ABORT: no itemsContainer'); return; }
    var wrap = document.getElementById('infinitePreviewWrap');

    if (curMenu === 3) {
        applyInfLayoutToDOM();
        container.style.display = 'none';
        if (wrap) {
            wrap.style.display = 'block';
            buildInfColorGrid();
            renderInfinitePreview();
        }
        if (zc) zc.scrollTop = savedScroll;
        return;
    }
    container.style.display = '';
    if (wrap) wrap.style.display = 'none';
    var count = (curMenu === 0) ? pieCount : (curMenu === 1) ? quickCount : 8;
    dbg('  rendering ' + count + ' slots');
    container.innerHTML = '';

    for (var i = 0; i < count; i++) {
        var card = document.createElement('div');
        card.className = 'item-card';
        card.style.borderLeftColor = COLORS[i % COLORS.length];

        var label = document.createElement('div');
        label.className = 'item-label';
        var dot = document.createElement('span');
        dot.className = 'color-dot';
        dot.style.background = COLORS[i % COLORS.length];
        label.appendChild(dot);

        if (curMenu === 2) {
            var dirs = ['Top','Bottom','Left','Right'];
            var dir = dirs[Math.floor(i / 2)];
            var sub = (i % 2 === 0) ? '1' : '2';
            label.appendChild(document.createTextNode(dir + ' ' + sub));
        } else {
            label.appendChild(document.createTextNode('Slot ' + (i + 1)));
        }
        card.appendChild(label);

        var l = LANG[language] || LANG[0];
        addField(card, l.sName, 'itemName_' + i, items[curMenu][curPage][i].name);
        addEffectField(card, i);
        (function(slotIdx, slotMenu, slotPage) {
            var hkDiv = document.createElement('div');
            hkDiv.className = 'field-row';
            var hkLabel = document.createElement('label');
            hkLabel.textContent = 'Hotkey';
            hkDiv.appendChild(hkLabel);
            var hkBtn = document.createElement('button');
            hkBtn.className = 'btn-tiny-record';
            var keyCode = items[slotMenu][slotPage][slotIdx].slotKey || 0;
            var modCode = items[slotMenu][slotPage][slotIdx].slotMod || 0;
            hkBtn.textContent = keyCode ? getKeyName(keyCode, modCode) : 'Rec';
            hkBtn.addEventListener('click', function(m, p, i, btnEl) {
                return function() {
                    var orig = btnEl.textContent;
                    btnEl.textContent = '...';
                    startSlotRecording(btnEl, function(k, mod) {
                        items[m][p][i].slotKey = k;
                        items[m][p][i].slotMod = mod;
                        btnEl.textContent = k ? getKeyName(k, mod) : 'Rec';
                        saveSettings();
                    });
                };
            }(slotMenu, slotPage, slotIdx, hkBtn));
            hkDiv.appendChild(hkBtn);
            card.appendChild(hkDiv);
        })(i, curMenu, curPage);
        addImageField(card, i);
        addSizeSlider(card, i);

        container.appendChild(card);
    }
    if (zc) {
        zc.scrollTop = savedScroll;
        var tries = 0;
        (function restore() {
            if (zc.scrollTop === savedScroll) return;
            if (++tries > 15) return;
            zc.scrollTop = savedScroll;
            setTimeout(restore, 80);
        })();
    }
}

function rebuildPresetSelect() {
    evalScript('readSettings()').then(function(data) {
        var ps = document.getElementById('presetSelect');
        if (!ps) return;
        ps.innerHTML = '<option value="">(none)</option>';
        if (!data) return;
        var re = /preset_([^_]+)_start/g;
        var match;
        var seen = {};
        while ((match = re.exec(data)) !== null) {
            var name = match[1];
            if (!seen[name]) {
                seen[name] = true;
                var opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                ps.appendChild(opt);
            }
        }
    });
}

function cleanCrossMenuData() {
    for (var m = 0; m < 3; m++) {
        for (var p = 0; p < PAGES; p++) {
            for (var i = 0; i < MAX; i++) {
                items[m][p][i] = {name:'',effect:'',effectDisplay:'',image:'',imageHover:'',size:80,slotKey:0,slotMod:0,slotAction:0};
            }
        }
    }
    renderMenu();
    saveSettings();
    dbg('Cross-menu data cleaned');
}

function clearAllSlots() {
    if (!confirm('\u786e\u5b9a\u6e05\u9664\u6240\u6709\u6982\u4f4d\u6570\u636e\uff1f\u8fd9\u5c06\u91cd\u7f6e Pie/Quick/Wheel/Infinite \u6240\u6709\u83dc\u5355\u7684\u914d\u7f6e\u3002')) return;
    for (var m = 0; m < 4; m++) {
        for (var p = 0; p < PAGES; p++) {
            for (var i = 0; i < MAX; i++) {
                items[m][p][i] = {name:'',effect:'',effectDisplay:'',image:'',imageHover:'',size:80,slotKey:0,slotMod:0,slotAction:0};
            }
        }
    }
    window._infSlotData = [];
    window._infSectorColors = ['#3a6a3a','#6a5a3a','#3a5a7a','#6a3a5a','#5a5a3a','#3a6a5a','#5a3a6a','#6a4a3a'];
    renderMenu();
    if (curMenu === 3) renderInfinitePreview();
    saveSettings();
    dbg('All slots cleared');
}
function rebuildFbRecent() {
    var sel = document.getElementById('fbRecentSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">(none)</option>';
    for (var i = 0; i < g_fbRecent.length && i < 15; i++) {
        var opt = document.createElement('option');
        opt.value = g_fbRecent[i];
        var parts = g_fbRecent[i].split(/[/\\]/);
        opt.textContent = parts[parts.length - 1];
        sel.appendChild(opt);
    }
}

function renderInfinitePreview() {
    var n = parseInt((document.getElementById('infSectors') || {}).value) || 8;
    var splitR2 = (document.getElementById('infSplitR2') || {}).value || '2a';
    var splitR3 = ((document.getElementById('infSplitR3') || {}).value) || '3';
    var r2Slots = (splitR2 === 'nosplit') ? 1 : 2;
    var r3Slots = (splitR3 === 'nosplit') ? 1 : parseInt(splitR3);
    var perSector = 1 + r2Slots + r3Slots;
    var totalSlots = n * perSector;
    if (!window._infSlotData) window._infSlotData = [];
    while (window._infSlotData.length < totalSlots) window._infSlotData.push({});
    var sel = document.getElementById('infSectorSelect');
    if (sel) {
        var curVal = parseInt(sel.value);
        sel.innerHTML = '';
        for (var ss = 0; ss < n; ss++) {
            var opt = document.createElement('option');
            opt.value = ss; opt.textContent = (ss + 1) + '/' + n;
            sel.appendChild(opt);
        }
        sel.value = curVal < n ? curVal : 0;
    }
    renderSectorSlots(sel ? parseInt(sel.value) : 0);
}

function renderSectorSlots(sectorIdx) {
    var list = document.getElementById('infSlotList');
    if (!list) return;
    var n = parseInt((document.getElementById('infSectors') || {}).value) || 8;
    var splitR2 = (document.getElementById('infSplitR2') || {}).value || '2a';
    var splitR3 = ((document.getElementById('infSplitR3') || {}).value) || '3';
    var r2Slots = (splitR2 === 'nosplit') ? 1 : 2;
    var r3Slots = (splitR3 === 'nosplit') ? 1 : parseInt(splitR3);
    var perSector = 1 + r2Slots + r3Slots;
    var baseIdx = sectorIdx * perSector;
    list.innerHTML = '';
    function mkBox2(slot) {
        var sd = (window._infSlotData || [])[slot] || {};
        var div = document.createElement('div');
        div.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3px 2px;border:1px solid #555;border-radius:3px;cursor:pointer;font-size:9px;min-width:56px;gap:1px;background:' + (sd.name ? 'rgba(255,255,255,0.07)' : 'transparent') + ';';
        if (slot === window._infHoverSlot) div.style.borderColor = '#fff';
        var num = document.createElement('span');
        num.style.cssText = 'font-weight:bold;color:#888;font-size:8px;';
        num.textContent = slot + 1;
        div.appendChild(num);
        var nm = document.createElement('span');
        nm.style.cssText = 'color:' + (sd.name ? '#ddd' : '#666') + ';font-size:10px;overflow:hidden;text-overflow:ellipsis;max-width:50px;white-space:nowrap;';
        nm.textContent = sd.name || ('\u2699');
        div.appendChild(nm);
        if (sd.effect || sd.key) {
            var inf = document.createElement('span');
            inf.style.cssText = 'font-size:7px;color:#888;';
            inf.textContent = (sd.effect ? '*' : '') + (sd.key ? ' ' + sd.key : '');
            div.appendChild(inf);
        }
        div.addEventListener('click', function(e) { e.stopPropagation(); openInfiniteEdit(slot); });
        return div;
    }
    // R3 row
    var r3cnt = (splitR3 === 'nosplit') ? 1 : parseInt(splitR3);
    var r3row = document.createElement('div');
    r3row.style.cssText = 'display:flex;gap:3px;';
    var r3start = baseIdx + 1 + r2Slots;
    for (var i = r3cnt - 1; i >= 0; i--) {
        var s = r3start + i;
        var b = mkBox2(s);
        b.style.flex = '1';
        r3row.appendChild(b);
    }
    list.appendChild(r3row);
    // R2 row
    var r2row = document.createElement('div');
    r2row.style.cssText = 'display:flex;gap:3px;';
    if (splitR2 === 'nosplit') {
        var b2 = mkBox2(baseIdx + 1);
        b2.style.flex = '1';
        r2row.appendChild(b2);
    } else {
        for (var i2 = 1; i2 >= 0; i2--) {
            var s2 = baseIdx + 1 + i2;
            var b2 = mkBox2(s2);
            b2.style.flex = '1';
            r2row.appendChild(b2);
        }
    }
    list.appendChild(r2row);
    // R1 — full width
    var r1b = mkBox2(baseIdx);
    list.appendChild(r1b);
    // Draw mini ring
    drawMiniRing(sectorIdx);
}

function drawMiniRing(activeSectorIdx) {
    var c = document.getElementById('infMiniRing');
    if (!c) return;
    var ctx = c.getContext('2d');
    var w = 80, h = 80, cx = 40, cy = 40, rOut = 36, rIn = 22;
    var n = parseInt((document.getElementById('infSectors') || {}).value) || 8;
    var sectorColors = window._infSectorColors || [];
    for (var i = 0; i < 8; i++) { if (!sectorColors[i]) sectorColors[i] = '#3a6a3a'; }
    ctx.clearRect(0, 0, w, h);
    var slice = 2 * Math.PI / n;
    for (var s = 0; s < n; s++) {
        var a0 = -Math.PI/2 + s * slice;
        var a1 = a0 + slice;
        var base = sectorColors[s % 8];
        var brightness = (s === activeSectorIdx) ? 1.0 : 0.35;
        var r = Math.round(parseInt(base.substring(1,3),16) * brightness);
        var g = Math.round(parseInt(base.substring(3,5),16) * brightness);
        var b = Math.round(parseInt(base.substring(5,7),16) * brightness);
        ctx.beginPath();
        ctx.arc(cx, cy, rOut, a0, a1);
        ctx.arc(cx, cy, rIn, a1, a0, true);
        ctx.closePath();
        ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,' + (s === activeSectorIdx ? '0.9' : '0.2') + ')';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, rIn, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e1e1e';
    ctx.fill();
    ctx.fillStyle = '#888';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(activeSectorIdx + 1, cx, cy);
}

function openInfiniteEdit(slotIdx) {
    if (!window._infSlotData) window._infSlotData = [];
    var sd = window._infSlotData[slotIdx] || {};
    infEditedSlot = slotIdx;
    document.getElementById("infModalTitle").textContent = "编辑槽位 " + (slotIdx + 1);
    document.getElementById("infEditName").value = sd.name || "";
    document.getElementById("infEditEffect").value = sd.effect || "";
    document.getElementById("infEditKey").value = sd.key || "";
    document.getElementById("infEditIcon").value = sd.icon || "";
    document.getElementById("infEditFont").value = sd.font || 100;
    document.getElementById("infEditFontV").textContent = (sd.font || 100) + "%";
    document.getElementById("infEditIconSz").value = sd.iconSz || 80;
    document.getElementById("infEditIconSzV").textContent = (sd.iconSz || 80) + "%";
    document.getElementById("infEditAction").value = sd.action || 0;
    document.getElementById("infIconPrev").textContent = sd.icon ? "!" : "?";
    document.getElementById("infEditModal").style.display = "flex";
}

function drawSector(ctx, cx, cy, r0, r1, a0, a1, fill) {
    ctx.beginPath(); ctx.arc(cx, cy, r1, a0, a1); ctx.arc(cx, cy, r0, a1, a0, true); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 0.5; ctx.stroke();
}

function hexToHSL(hex) {
    var r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
    var mx = Math.max(r,g,b), mn = Math.min(r,g,b), h = 0, s = 0, l = (mx+mn)/2;
    if (mx !== mn) { var d = mx-mn; s = l > 0.5 ? d/(2-mx-mn) : d/(mx+mn);
        if (mx===r) h = ((g-b)/d + (g<b?6:0))/6; else if (mx===g) h = ((b-r)/d + 2)/6; else h = ((r-g)/d + 4)/6; }
    return {h:h*360, s:s*100, l:l*100};
}

function adjustColor(hex, sMul, lMul) {
    var hsl = hexToHSL(hex);
    hsl.s = Math.min(100, Math.max(0, hsl.s * sMul));
    hsl.l = Math.min(80, Math.max(3, hsl.l * lMul));
    return 'hsl(' + hsl.h + ',' + hsl.s + '%,' + hsl.l + '%)';
}

function infHitTest(mx, my) {
    var dx = mx - 200, dy = my - 200;
    var dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 6) return null;

    // Get current settings (must match renderInfinitePreview exactly)
    var n = parseInt((document.getElementById('infSectors') || {}).value) || 8;
    var rd = parseInt((document.getElementById('infRDz') || {}).value) || 20;
    var r1 = parseInt((document.getElementById('infR1') || {}).value) || 80;
    var r2 = parseInt((document.getElementById('infR2') || {}).value) || 140;
    var r3 = 190;
    if (rd >= r1 - 4) rd = Math.max(6, r1 - 4);
    if (r1 >= r2 - 4) r1 = Math.max(30, r2 - 4);
    if (r2 >= r3 - 4) r2 = Math.max(60, r3 - 4);
    var splitR2 = (document.getElementById('infSplitR2') || {}).value || '2a';
    var splitR3 = ((document.getElementById('infSplitR3') || {}).value) || '3';

    var slice = 2 * Math.PI / n;
    var angle = Math.atan2(dy, dx);
    var a = angle + Math.PI / 2;
    if (a < 0) a += 2 * Math.PI;
    // Clamp to [0, 2π) to avoid floating point at exactly 2π
    if (a >= 2 * Math.PI) a = 0;

    var s = Math.floor(a / slice);
    if (s < 0) s = 0;
    if (s >= n) s = n - 1;

    var ring = -1, sub = 0;
    if (dist < rd) return null;
    if (dist <= r1 + 0.5) { ring = 0; sub = 0; }
    else if (dist <= r2 + 0.5) {
        ring = 1;
        var la = a - s * slice;
        if (la < 0) la = 0; else if (la > slice) la = slice;
        if (splitR2 === '2a') {
            sub = Math.floor((la / slice) * 2);
            if (sub < 0) sub = 0; else if (sub > 1) sub = 1;
        } else {
            sub = dist < (r1 + r2) / 2 ? 0 : 1;
        }
    }
    else {
        ring = 2;
        var la2 = a - s * slice;
        if (la2 < 0) la2 = 0; else if (la2 > slice) la2 = slice;
        sub = Math.floor((la2 / slice) * splitR3);
        if (sub < 0) sub = 0; else if (sub >= splitR3) sub = splitR3 - 1;
    }

    // Look up matching hit area to get slot index
    var r2Slots = (splitR2 === 'nosplit') ? 1 : 2;
    var r3Slots = (splitR3 === 'nosplit') ? 1 : parseInt(splitR3);
    var perSector = 1 + r2Slots + r3Slots;
    var offset;
    if (ring === 0) offset = 0;
    else if (ring === 1) offset = 1 + sub;
    else offset = 3 + sub;
    var slotIdx = s * perSector + offset;
    return {slot: slotIdx, sector: s};
}

function buildInfColorGrid() {
    var grid = document.getElementById('infColorGrid');
    if (!grid) return;
    grid.innerHTML = '';
    var colors = window._infSectorColors || [];
    for (var s = 0; s < 8; s++) {
        if (!colors[s]) colors[s] = ['#3a6a3a','#6a5a3a','#3a5a7a','#6a3a5a','#5a5a3a','#3a6a5a','#5a3a6a','#6a4a3a'][s];
        var div = document.createElement('div');
        div.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:10px;color:#888;';
        var lbl = document.createElement('span');
        lbl.textContent = 'S' + (s+1);
        var inp = document.createElement('input');
        inp.type = 'color';
        inp.style.cssText = 'width:28px;height:18px;padding:0;border:1px solid #555;border-radius:2px;background:none;cursor:pointer;';
        inp.value = colors[s];
        inp.addEventListener('input', function(idx) { return function() {
            window._infSectorColors[idx] = this.value;
            renderInfinitePreview();
        }; }(s));
        div.appendChild(lbl); div.appendChild(inp); grid.appendChild(div);
    }
    window._infSectorColors = colors;
}

function addField(card, labelText, id, value, placeholder) {
    var row = document.createElement('div');
    row.className = 'field-row';
    var lbl = document.createElement('label');
    lbl.textContent = labelText;
    row.appendChild(lbl);
    var input = document.createElement('input');
    input.type = 'text'; input.id = id; input.value = value || '';
    if (placeholder) input.placeholder = placeholder;
    input.addEventListener('input', triggerAutoSave);
    row.appendChild(input);
    card.appendChild(row);
}

function addImageField(card, idx) {
    var l = LANG[language] || LANG[0];
    var row = document.createElement('div');
    row.className = 'field-row';
    var lbl = document.createElement('label');
    lbl.textContent = l.sImage;
    row.appendChild(lbl);
    var input = document.createElement('input');
    input.type = 'text'; input.id = 'itemImage_' + idx;
    input.value = items[curMenu][curPage][idx].image || '';
    input.placeholder = 'PNG/BMP path';
    input.style.flex = '1';
    input.addEventListener('input', triggerAutoSave);
    row.appendChild(input);
    var btn = document.createElement('button');
    btn.textContent = l.browse;
    btn.className = 'btn-browse';
    btn.addEventListener('click', function() {
        evalScript('browseFile()').then(function(path) {
          if (path) { input.value = path; triggerAutoSave(); }
        });
      });
    row.appendChild(btn);
    card.appendChild(row);
}

var g_effectSearchTargetIdx = -1;

function addEffectField(card, idx) {
    var row = document.createElement('div');
    row.className = 'field-row';
    var l = LANG[language] || LANG[0];
    var lbl = document.createElement('label');
    lbl.textContent = l.sEffect;
    row.appendChild(lbl);
    var wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex:1;gap:3px;';
    var display = document.createElement('div');
    display.className = 'effect-display';
    display.id = 'itemEffect_' + idx;
    var txt = items[curMenu][curPage][idx].effectDisplay || items[curMenu][curPage][idx].effect || '';
    display.textContent = txt;
    if (!display.textContent) display.classList.add('empty');
    display.dataset.idx = idx;
    display.addEventListener('click', function() {
        openEffectSearch(parseInt(this.dataset.idx));
    });
    wrap.appendChild(display);
    var clearBtn = document.createElement('button');
    clearBtn.textContent = '✕';
    clearBtn.title = 'Clear effect';
    clearBtn.style.cssText = 'background:#3a3a3a;border:1px solid #555;border-radius:3px;color:#888;cursor:pointer;padding:0 6px;font-size:10px;line-height:22px;';
    clearBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var i = parseInt(display.dataset.idx);
        items[curMenu][curPage][i].effect = '';
        items[curMenu][curPage][i].effectDisplay = '';
        display.textContent = '';
        display.classList.add('empty');
        saveSettings();
    });
    wrap.appendChild(clearBtn);
    dbg('addEffectField idx=' + idx + ' text="' + txt + '" id=itemEffect_' + idx);
    row.appendChild(wrap);
    card.appendChild(row);
}

function matchToDisplay(match) {
    var s = match;
    s = s.replace(/_/g, ' ');
    s = s.replace(/([a-z])([A-Z0-9])/g, '$1 $2');
    s = s.replace(/([0-9])([A-Z])/g, '$1 $2');
    s = s.replace(/\s+/g, ' ').trim();
    return s;
}

var g_effectsMapPollTimer = null;

function processEffectsMap(content) {
    if (!content || content.length < 5) return 0;
    var added = 0;
    content.split('\n').forEach(function(line) {
        var p = line.indexOf('|');
        if (p < 0) return;
        var name = line.substring(0, p), match = line.substring(p + 1);
        if (!match) return;
        if (!g_nameMap[match]) {
            g_nameMap[match] = name || matchToDisplay(match);
            added++;
        }
    });
    if (added > 0) {
        dbg('effects map loaded: ' + added + ' new entries');
        g_effectsCache = null;
        loadEffectsCache();
    }
    return added;
}

function startEffectsMapPoll() {
    if (g_effectsMapPollTimer) { clearInterval(g_effectsMapPollTimer); g_effectsMapPollTimer = null; }
    var attempts = 0;
    g_effectsMapPollTimer = setInterval(function() {
        attempts++;
        evalScript('readEffectsMap()').then(function(content) {
            if (content && content.length > 5) {
                clearInterval(g_effectsMapPollTimer);
                g_effectsMapPollTimer = null;
                var added = processEffectsMap(content);
                var btn = document.getElementById('scanBtn');
                if (btn) {
                    btn.textContent = '✔ ' + added + ' new';
                    btn.style.color = '#5c5';
                    btn.disabled = false;
                    setTimeout(function() { btn.textContent = 'Scan Effects'; btn.style.color = ''; }, 2000);
                }
            } else if (attempts > 100) {
                clearInterval(g_effectsMapPollTimer);
                g_effectsMapPollTimer = null;
                dbg('effects map poll timed out, falling back to ExtendScript');
                evalScript('getAllEffects()').then(function(raw) {
                    var added = 0;
                    raw.split('\n').forEach(function(line) {
                        var p = line.indexOf('|');
                        if (p < 0) return;
                        var name = line.substring(0, p), match = line.substring(p + 1);
                        if (!match) return;
                        if (!g_nameMap[match]) {
                            g_nameMap[match] = name || matchToDisplay(match);
                            added++;
                        }
                    });
                    if (added > 0) {
                        g_effectsCache = null;
                        loadEffectsCache();
                    }
                    var btn = document.getElementById('scanBtn');
                    if (btn) {
                        btn.textContent = '✔ ' + added + ' new';
                        btn.style.color = '#5c5';
                        btn.disabled = false;
                        setTimeout(function() { btn.textContent = 'Scan Effects'; btn.style.color = ''; }, 2000);
                    }
                });
            }
        });
    }, 200);
}

function loadEffectsCache() {
    if (g_effectsCache) { dbg('cache already loaded: ' + g_effectsCache.length + ' effects'); return Promise.resolve(g_effectsCache); }
    dbg('loading effects cache from name map (' + Object.keys(g_nameMap).length + ' entries)...');
    g_effectsCache = [];
    for (var match in g_nameMap) {
        if (g_nameMap.hasOwnProperty(match)) {
            var name = g_nameMap[match];
            if (!name || name === match) name = matchToDisplay(match);
            g_effectsCache.push({ name: name, match: match });
        }
    }
    g_effectsCache.sort(function(a, b) { return a.name.localeCompare(b.name); });
    dbg('cache loaded: ' + g_effectsCache.length + ' unique effects');
    var sample = g_effectsCache.filter(function(e) { return e.name.toLowerCase().indexOf('re:') >= 0 || e.match.toLowerCase().indexOf('re:') >= 0; });
    dbg('effects matching "re:" = ' + sample.length + ' samples: ' + sample.slice(0,3).map(function(e){return e.name+'|'+e.match;}).join(', '));
    return Promise.resolve(g_effectsCache);
}

function updateEffectResults(query) {
    var container = document.getElementById('effectSearchResults');
    var countEl = document.getElementById('effectSearchCount');
    if (!query || query.length < 1) {
        if (g_recentEffects.length > 0) {
            container.innerHTML = '<div style="padding:8px 12px;color:#888;font-size:11px;font-weight:600;">Recent</div>';
            for (var ri = 0; ri < g_recentEffects.length && ri < 10; ri++) {
                var re = g_recentEffects[ri];
                var item = document.createElement('div');
                item.className = 'effect-item';
                var nameSpan = document.createElement('span');
                nameSpan.className = 'effect-name';
                nameSpan.textContent = re.name;
                var matchSpan = document.createElement('span');
                matchSpan.className = 'effect-match';
                matchSpan.textContent = re.match;
                item.appendChild(nameSpan);
                item.appendChild(matchSpan);
                (function(displayName, matchName) {
                    item.addEventListener('mousedown', function(e) {
                        e.preventDefault();
                        selectEffect(displayName, matchName);
                    });
                })(re.name, re.match);
                container.appendChild(item);
            }
        } else {
            container.innerHTML = '<div style="padding:12px;color:#666;font-size:12px;text-align:center;">' +
                (LANG[language] ? LANG[language].searchPH : 'Search effects...') + '</div>';
        }
        if (countEl) countEl.textContent = '';
        return;
    }
    if (!g_effectsCache || !g_effectsCache.length) {
        dbg('search: cache not ready yet');
        container.innerHTML = '<div style="padding:12px;color:#666;font-size:12px;text-align:center;">Loading...</div>';
        return;
    }
    var q = query.toLowerCase();
    var results = g_effectsCache.filter(function(e) {
        return e.name.toLowerCase().indexOf(q) >= 0 || e.match.toLowerCase().indexOf(q) >= 0;
    });
    dbg('search "' + query + '" → ' + results.length + ' results');
    if (results.length > 0) dbg('first 3: ' + results.slice(0,3).map(function(e){return e.name+'|'+e.match;}).join(', '));
    if (countEl) countEl.textContent = results.length + ' results' + (results.length > 500 ? ' (showing all)' : '');
    if (results.length === 0) {
        container.innerHTML = '<div style="padding:12px;color:#888;font-size:12px;text-align:center;">No results</div>';
        return;
    }
    container.innerHTML = '';
    var count = results.length;
    for (var i = 0; i < count; i++) {
        var item = document.createElement('div');
        item.className = 'effect-item';
        var nameSpan = document.createElement('span');
        nameSpan.className = 'effect-name';
        nameSpan.textContent = results[i].name;
        var matchSpan = document.createElement('span');
        matchSpan.className = 'effect-match';
        matchSpan.textContent = results[i].match;
        item.appendChild(nameSpan);
        item.appendChild(matchSpan);
        (function(displayName, matchName) {
            item.addEventListener('mousedown', function(e) {
                e.preventDefault();
                selectEffect(displayName, matchName);
            });
        })(results[i].name, results[i].match);
        container.appendChild(item);
    }
}

function openEffectSearch(idx) {
    g_effectSearchTargetIdx = idx;
    dbg('openEffectSearch idx=' + idx + ' curMenu=' + curMenu + ' curPage=' + curPage);
    dbg('  items data before open: effect="' + items[curMenu][curPage][idx].effect + '" effectDisplay="' + items[curMenu][curPage][idx].effectDisplay + '"');
    var input = document.getElementById('effectSearchInput');
    var overlay = document.getElementById('effectSearchOverlay');
    input.value = items[curMenu][curPage][idx].effectDisplay || '';
    overlay.style.display = 'flex';
    setTimeout(function() { input.focus(); input.select(); }, 50);
    loadEffectsCache().then(function() {
        updateEffectResults(input.value);
    });
}

function closeEffectSearch() {
    document.getElementById('effectSearchOverlay').style.display = 'none';
    g_effectSearchTargetIdx = -1;
    g_infEffectSearch = false;
}

function selectEffect(displayName, matchName) {
    var idx = g_effectSearchTargetIdx;
    dbg('selectEffect idx=' + idx + ' displayName="' + displayName + '" matchName="' + matchName + '"');
    if (idx < 0) { dbg('  ABORT: no target idx'); return; }
    if (g_infEffectSearch) {
        var el = document.getElementById('infEditEffect');
        if (el) { el.value = matchName; el.dataset.display = displayName; }
        closeEffectSearch();
        saveSettings();
        return;
    }
    items[curMenu][curPage][idx].effect = matchName;
    items[curMenu][curPage][idx].effectDisplay = displayName;
    dbg('  items[' + curMenu + '][' + curPage + '][' + idx + '] set');
    // Track recent effect
    var idx2 = g_recentEffects.findIndex(function(r) { return r.match === matchName; });
    if (idx2 >= 0) g_recentEffects.splice(idx2, 1);
    g_recentEffects.unshift({name: displayName, match: matchName});
    if (g_recentEffects.length > RECENT_MAX) g_recentEffects.length = RECENT_MAX;
    saveRecentEffects();
    closeEffectSearch();
    // Direct DOM update — no renderMenu, no setTimeout
    var el = document.getElementById('itemEffect_' + idx);
    if (el) {
        el.textContent = displayName;
        el.classList.remove('empty');
        dbg('  dom updated: text="' + displayName + '"');
    }
    saveSettings();
}

function saveScrollPos() {
    var zc = document.getElementById('zoomContent');
    return zc ? zc.scrollTop : 0;
}

function restoreScrollPos(pos) {
    var zc = document.getElementById('zoomContent');
    if (zc) { zc.scrollTop = pos; }
}

function addSizeSlider(card, idx) {
    var l = LANG[language] || LANG[0];
    var row = document.createElement('div');
    row.className = 'field-row';
    var lbl = document.createElement('label');
    lbl.textContent = l.sSize;
    row.appendChild(lbl);
    var val = items[curMenu][curPage][idx].size || 80;
    var slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 50; slider.max = 200; slider.value = val;
    slider.id = 'itemSize_' + idx;
    slider.style.width = '80px';
    var display = document.createElement('span');
    display.className = 'slider-value';
    display.style.minWidth = '32px';
    display.style.textAlign = 'center';
    display.textContent = val + '%';
    slider.addEventListener('input', function() {
        display.textContent = this.value + '%';
        triggerAutoSave();
    });
    row.appendChild(slider);
    row.appendChild(display);
    card.appendChild(row);
}

function updateTriggerDisplay() {
    var input = document.getElementById('triggerInput');
    if (!input) return;
    if (triggerKey) {
        var mods = [];
        if (triggerMod & 1) mods.push('Alt');
        if (triggerMod & 2) mods.push('Ctrl');
        if (triggerMod & 4) mods.push('Shift');
        if (triggerMod & 8) mods.push('Win');
        var keyName = {32:'Space', 9:'Tab', 13:'Enter', 27:'Esc'}[triggerKey] || ('VK_' + triggerKey);
        input.value = mods.join('+') + (mods.length ? '+' : '') + keyName;
    }
}

function formatKeys(key, mod) {
    var mods = [];
    if (mod & 1) mods.push('Alt');
    if (mod & 2) mods.push('Ctrl');
    if (mod & 4) mods.push('Shift');
    if (mod & 8) mods.push('Win');
    var keyName = {32:'Space', 9:'Tab', 13:'Enter', 27:'Esc'}[key] || String.fromCharCode(key).toUpperCase();
    return mods.join('+') + (mods.length ? '+' : '') + keyName;
}

function formatKeyName(key) {
    return {32:'Space', 9:'Tab', 13:'Enter', 27:'Esc', 90:'Z', 88:'X'}[key] || (key >= 65 && key <= 90 ? String.fromCharCode(key) : 'VK_' + key);
}

function updatePageKeyDisplay() {
    var pi = document.getElementById('prevPageInput');
    if (pi) pi.value = formatKeyName(prevPageKey);
    var ni = document.getElementById('nextPageInput');
    if (ni) ni.value = formatKeyName(nextPageKey);
}

function getKeyName(key, mod) {
    var mods = [];
    if (mod & 1) mods.push('Alt');
    if (mod & 2) mods.push('Ctrl');
    if (mod & 4) mods.push('Shift');
    if (mod & 8) mods.push('Win');
    var keyName = {32:'Space', 9:'Tab', 13:'Enter', 27:'Esc'}[key] || ('VK_' + key);
    return (mods.length ? mods.join('+') + '+' : '') + keyName;
}

function startSlotRecording(btnEl, callback) {
    var savedHandler = window.__slotKeyHandler;
    if (savedHandler) {
        document.removeEventListener('keydown', savedHandler);
        window.__slotKeyHandler = null;
    }
    btnEl.textContent = '...';
    btnEl.style.color = '#ff0';
    var handler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        var k = e.keyCode || e.which;
        var m = 0;
        if (e.altKey) m |= 1;
        if (e.ctrlKey) m |= 2;
        if (e.shiftKey) m |= 4;
        if (e.metaKey) m |= 8;
        if (k === 27) { btnEl.textContent = 'Rec'; btnEl.style.color = ''; }
        else { btnEl.textContent = getKeyName(k, m); btnEl.style.color = ''; callback(k, m); }
        document.removeEventListener('keydown', handler);
        window.__slotKeyHandler = null;
        return false;
    };
    window.__slotKeyHandler = handler;
    document.addEventListener('keydown', handler);
    setTimeout(function() {
        if (window.__slotKeyHandler === handler) {
            document.removeEventListener('keydown', handler);
            window.__slotKeyHandler = null;
            btnEl.textContent = 'Rec'; btnEl.style.color = '';
        }
    }, 5000);
}

var isRecording = false;
function startRecording(inputEl, btnEl, callback) {
    isRecording = true;
    inputEl.value = '...';
    inputEl.className = 'recording';
    btnEl.textContent = '...';
    // Disable trigger hotkey to prevent interference during recording
    evalScript('readSettings()').then(function(data) {
        if (data) {
            var lines = [];
            data.split('\n').forEach(function(l) {
                if (l.indexOf('trigger_disabled=') < 0 && l.indexOf('trigger_key=') < 0 && l.indexOf('trigger_mod=') < 0)
                    lines.push(l);
            });
            lines.push('trigger_disabled=1');
            lines.push('trigger_key=0');
            lines.push('trigger_mod=0');
            evalScript('writeSettings(' + JSON.stringify(lines.join('\n')) + ')');
        }
    });
    function onKeyDown(e) {
        e.preventDefault();
        var key = e.keyCode, mod = 0;
        if (e.altKey) mod |= 1; if (e.ctrlKey) mod |= 2;
        if (e.shiftKey) mod |= 4; if (e.metaKey) mod |= 8;
        if (key === 16 || key === 17 || key === 18 || key === 91) return;
        isRecording = false;
        inputEl.className = ''; btnEl.className = 'btn-record';
        var l = LANG[language] || LANG[0];
        btnEl.textContent = l.record;
        document.removeEventListener('keydown', onKeyDown, true);
        callback(key, mod);
        inputEl.value = formatKeys(key, mod);
        saveSettings();
    }
    document.addEventListener('keydown', onKeyDown, true);
}

document.addEventListener('DOMContentLoaded', function() {
    try {
    loadSettings();
    rebuildPresetSelect();

    document.querySelectorAll('#menuTabs .tab').forEach(function(b) {
        b.addEventListener('click', function() { switchMenu(parseInt(this.dataset.menu)); });
    });

    var s = document.getElementById('winAlphaSlider');
    var slv = document.getElementById('winAlphaValue');
    if (s && slv) s.addEventListener('input', function() { slv.textContent = this.value; winAlpha = parseInt(this.value); triggerAutoSave(); });

    var bc = document.getElementById('bgColorInput');
    if (bc) bc.addEventListener('input', function() {
        document.getElementById('bgColorText').textContent = this.value.toUpperCase();
        triggerAutoSave();
    });

    var ba = document.getElementById('bgAlphaSlider');
    var bav = document.getElementById('bgAlphaValue');
    if (ba && bav) ba.addEventListener('input', function() { bav.textContent = this.value; bgAlpha[curMenu] = parseInt(this.value); triggerAutoSave(); });

    var gc = document.getElementById('glowColorInput');
    if (gc) gc.addEventListener('input', function() {
        document.getElementById('glowColorText').textContent = this.value.toUpperCase();
        triggerAutoSave();
    });

    var pgc = document.getElementById('pageColorInput');
    if (pgc) pgc.addEventListener('input', function() {
        document.getElementById('pageColorText').textContent = this.value.toUpperCase();
        triggerAutoSave();
    });

    var gi = document.getElementById('glowIntensitySlider');
    var giv = document.getElementById('glowIntensityValue');
    if (gi && giv) gi.addEventListener('input', function() { giv.textContent = this.value; glowIntensity[curMenu] = parseInt(this.value); triggerAutoSave(); });

    var id = document.getElementById('imgDistSlider');
    var idv = document.getElementById('imgDistValue');
    if (id && idv) id.addEventListener('input', function() { idv.textContent = this.value; imgDist[curMenu] = parseInt(this.value); triggerAutoSave(); });

    var td = document.getElementById('textDistSlider');
    var tdv = document.getElementById('textDistValue');
    if (td && tdv) td.addEventListener('input', function() { tdv.textContent = this.value; textDist[curMenu] = parseInt(this.value); triggerAutoSave(); });

    var ts = document.getElementById('textSizeSlider');
    var tsv = document.getElementById('textSizeValue');
    if (ts && tsv) ts.addEventListener('input', function() { tsv.textContent = this.value + '%'; textSize[curMenu] = parseInt(this.value); triggerAutoSave(); });

    var pc = document.getElementById('pieCountSelect');
    if (pc) pc.addEventListener('change', function() { pieCount = parseInt(this.value); renderMenu(); saveSettings(); });

    var qc = document.getElementById('quickCountSelect');
    if (qc) qc.addEventListener('change', function() { quickCount = parseInt(this.value); renderMenu(); saveSettings(); });

    var uz = document.getElementById('uiZoomSlider');
    var uzv = document.getElementById('uiZoomValue');
    if (uz && uzv) uz.addEventListener('input', function() {
        uzv.textContent = this.value; uiZoom[curMenu] = parseInt(this.value);
        var zc = document.getElementById('zoomContent');
        if (zc) zc.style.zoom = (uiZoom[curMenu] / 100).toFixed(2);
        triggerAutoSave();
    });

    var ms = document.getElementById('menuScaleSlider');
    var msv = document.getElementById('menuScaleValue');
    if (ms && msv) ms.addEventListener('input', function() { msv.textContent = this.value; menuScale[curMenu] = parseInt(this.value); triggerAutoSave(); });

    var nt = document.getElementById('numpadToggle');
    if (nt) nt.addEventListener('change', function() { numpadEnabled = this.checked; saveSettings(); });
    var wcs = document.getElementById('wheelCountSelect');
    if (wcs) wcs.addEventListener('change', function() { infiniteCount = parseInt(this.value) || 8; saveSettings(); });
    var sm0 = document.getElementById('selectMode0');
    var sm1 = document.getElementById('selectMode1');
    if (sm0) sm0.addEventListener('change', function() { if (this.checked) { selectMode = 0; saveSettings(); } });
    if (sm1) sm1.addEventListener('change', function() { if (this.checked) { selectMode = 1; saveSettings(); } });

    var gt = document.getElementById('guideToggle');
    if (gt) gt.addEventListener('change', function() { guideEnabled = this.checked; saveSettings(); });
    var guildWidthEl = document.getElementById('guideWidthSlider');
    var guildWidthVal = document.getElementById('guideWidthValue');
    if (guildWidthEl && guildWidthVal) guildWidthEl.addEventListener('input', function() { guildWidthVal.textContent = this.value; guideWidth = parseInt(this.value); triggerAutoSave(); });
    var guideColorEl = document.getElementById('guideColorInput');
    if (guideColorEl) guideColorEl.addEventListener('input', function() {
        document.getElementById('guideColorText').textContent = this.value.toUpperCase();
        triggerAutoSave();
    });

    var ecb = document.getElementById('exportCfgBtn');
    if (ecb) ecb.addEventListener('click', function() {
        evalScript('exportSettingsToFile()').then(function(path) {
            if (path) dbg('Config exported: ' + path);
        });
    });
    var icb = document.getElementById('importCfgBtn');
    if (icb) icb.addEventListener('click', function() {
        evalScript('importSettingsFromFile()').then(function(data) {
            if (data && data.length > 10) {
                evalScript('writeSettings("' + data.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n') + '")').then(function() {
                    loadSettings();
                    dbg('Config imported');
                });
            }
        });
    });

    var spb = document.getElementById('savePresetBtn');
    if (spb) spb.addEventListener('click', function() {
        var nameInput = document.getElementById('presetNameInput');
        if (!nameInput || !nameInput.value.trim()) return;
        var name = nameInput.value.trim();
        // save current trigger settings as preset via settings.txt
        var linesToSave = 'trigger_key=' + triggerKey + '\ntrigger_mod=' + triggerMod + '\n';
        evalScript('readSettings()').then(function(data) {
            var existing = data || '';
            // Find or create preset marker
            var marker = 'preset_' + name + '_start';
            var markerEnd = 'preset_' + name + '_end';
            var newBlock = marker + '\n' + linesToSave + markerEnd;
            if (existing.indexOf(marker) >= 0) {
                var re = new RegExp(marker + '[\\s\\S]*?' + markerEnd);
                existing = existing.replace(re, newBlock);
            } else {
                existing += '\n' + newBlock;
            }
            evalScript('writeSettings("' + existing.replace(/\\/g,'\\\\').replace(/"/g,'\\"') + '")');
            // Rebuild preset select
            rebuildPresetSelect();
            saveSettings();
        });
    });

    // FlowBoard Save: save current settings to .wbflow file
    var fbs = document.getElementById('fbSaveBtn');
    if (fbs) fbs.addEventListener('click', function() {
        collectFromUI();
        // Build settings text by reading existing file
        evalScript('readSettings()').then(function(data) {
            var escaped = (data||'').replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n');
            evalScript('saveFlowBoardFile("' + escaped + '")').then(function(path) {
                if (path) {
                    dbg('FlowBoard saved: ' + path);
                    var idx = g_fbRecent.indexOf(path);
                    if (idx >= 0) g_fbRecent.splice(idx, 1);
                    g_fbRecent.unshift(path);
                    if (g_fbRecent.length > 15) g_fbRecent.length = 15;
                    try { localStorage.setItem('wb_fb_recent', JSON.stringify(g_fbRecent)); } catch(e) {}
                    rebuildFbRecent();
                }
            });
        });
    });

    // FlowBoard Load: select .wbflow file and apply it
    var fbl = document.getElementById('fbLoadBtn');
    if (fbl) fbl.addEventListener('click', function() {
        evalScript('openFlowBoardFile()').then(function(content) {
            if (content && content.length > 10) {
                evalScript('writeSettings("' + content.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n') + '")').then(function() {
                    loadSettings();
                    var btn = document.getElementById('scanBtn');
                    if (btn) dbg('FlowBoard state loaded');
                });
            }
        });
    });

    // FlowBoard Apply: read recent file and apply
    var fba = document.getElementById('fbApplyBtn');
    if (fba) fba.addEventListener('click', function() {
        var sel = document.getElementById('fbRecentSelect');
        if (!sel || !sel.value) return;
        var path = sel.value;
        // Extract filename for a simple ExtendScript read
        var parts = path.split(/[/\\]/);
        var fname = parts[parts.length - 1];
        evalScript('openFlowBoardFile()').then(function(content) {
            if (content && content.length > 10) {
                evalScript('writeSettings("' + content.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n') + '")').then(function() {
                    loadSettings();
                    dbg('FlowBoard applied: ' + fname);
                });
            }
        });
    });

    // FlowBoard Delete: remove recent entry
    var fbd = document.getElementById('fbDelBtn');
    if (fbd) fbd.addEventListener('click', function() {
        var sel = document.getElementById('fbRecentSelect');
        if (!sel || !sel.value) return;
        var path = sel.value;
        var idx = g_fbRecent.indexOf(path);
        if (idx >= 0) { g_fbRecent.splice(idx, 1); }
        try { localStorage.setItem('wb_fb_recent', JSON.stringify(g_fbRecent)); } catch(e) {}
        rebuildFbRecent();
    });

    // Load FlowBoard recent
    try { var fb = localStorage.getItem('wb_fb_recent'); if (fb) g_fbRecent = JSON.parse(fb); rebuildFbRecent(); } catch(e) {}

    document.getElementById('clearAllSlotsBtn').addEventListener('click', clearAllSlots);
    var csb = document.getElementById('cleanSlotsBtn');
    if (csb) csb.addEventListener('click', cleanCrossMenuData);

    // FlowBoard Generate: create wbflow with N random effects
    var fbg = document.getElementById('fbGenBtn');
    if (fbg) fbg.addEventListener('click', function() {
        var n = prompt('生成多少步骤？(1-48)', 10);
        if (!n) return;
        var count = parseInt(n);
        if (isNaN(count) || count < 1) { alert('最少1步'); return; }
        if (count > 48) { alert('最多48步'); return; }
        // Build effect names from g_nameMap
        var effectList = [];
        for (var mk in g_nameMap) {
            if (g_nameMap.hasOwnProperty(mk)) {
                var dn = g_nameMap[mk];
                if (!dn || dn === mk) dn = mk;
                effectList.push({name: dn, match: mk});
            }
        }
        if (effectList.length === 0) { dbg('no effects loaded yet — use defaults'); return; }
        // Shuffle and pick N
        for (var si = effectList.length - 1; si > 0; si--) {
            var rj = Math.floor(Math.random() * (si + 1));
            var tmp = effectList[si]; effectList[si] = effectList[rj]; effectList[rj] = tmp;
        }
        var selected = effectList.slice(0, Math.min(count, effectList.length));
        // Build settings lines
        var lines = [
            'settings_version=' + Date.now(),
            'menu_type=3',
            'infinite_sectors=' + Math.min(count, 8),
            'infinite_split_R2=2a',
            'infinite_split_R3=3',
            'infinite_rDead=20',
            'infinite_r1=80',
            'infinite_r2=140'
        ];
        for (var si2 = 0; si2 < selected.length; si2++) {
            var se = selected[si2];
            var sp = 'infinite_0_' + si2 + '_';
            lines.push(sp + 'n=' + se.name);
            lines.push(sp + 'e=' + se.match);
        }
        lines.push('infinite_sector_0_color=3a6a3a');
        var text = lines.join('\n') + '\n';
        evalScript('saveFlowBoardFile(' + JSON.stringify(text) + ')').then(function(path) {
            if (path) {
                dbg('Generated FlowBoard saved: ' + path + ' (' + selected.length + ' steps)');
                var idx = g_fbRecent.indexOf(path);
                if (idx >= 0) g_fbRecent.splice(idx, 1);
                g_fbRecent.unshift(path);
                if (g_fbRecent.length > 15) g_fbRecent.length = 15;
                try { localStorage.setItem('wb_fb_recent', JSON.stringify(g_fbRecent)); } catch(e) {}
                rebuildFbRecent();
                 dbg('Generated: ' + selected.length + ' steps');
            }
        });
    });

    var lpb = document.getElementById('loadPresetBtn');
    if (lpb) lpb.addEventListener('click', function() {
        var ps = document.getElementById('presetSelect');
        if (!ps || !ps.value) return;
        var presetName = ps.value;
        evalScript('readSettings()').then(function(data) {
            var marker = 'preset_' + presetName + '_start';
            var markerEnd = 'preset_' + presetName + '_end';
            var m = data.indexOf(marker);
            if (m >= 0) {
                var end = data.indexOf(markerEnd, m);
                if (end > m) {
                    var block = data.substring(m + marker.length, end).trim();
                    var lines = block.split('\n');
                    lines.forEach(function(l) {
                        var p = l.indexOf('=');
                        if (p > 0) {
                            var k = l.substring(0, p).trim(), v = l.substring(p+1).trim();
                            if (k === 'trigger_key') triggerKey = parseInt(v) || 32;
                            if (k === 'trigger_mod') triggerMod = parseInt(v) || 6;
                        }
                    });
                    updateTriggerDisplay();
                    saveSettings();
                    dbg('Loaded preset: ' + presetName);
                }
            }
        });
    });

    var dpb = document.getElementById('deletePresetBtn');
    if (dpb) dpb.addEventListener('click', function() {
        var ps = document.getElementById('presetSelect');
        if (!ps || !ps.value) return;
        var presetName = ps.value;
        evalScript('readSettings()').then(function(data) {
            var marker = 'preset_' + presetName + '_start';
            var markerEnd = 'preset_' + presetName + '_end';
            var re = new RegExp('\\n?' + marker + '[\\s\\S]*?' + markerEnd + '\\n?');
            var newData = data.replace(re, '');
            evalScript('writeSettings("' + newData.replace(/\\/g,'\\\\').replace(/"/g,'\\"') + '")');
            rebuildPresetSelect();
            saveSettings();
        });
    });

    document.getElementById('triggerBtn').addEventListener('click', function() {
        if (isRecording) return;
        startRecording(document.getElementById('triggerInput'), this, function(k, m) { triggerKey = k; triggerMod = m; });
    });

    // Page key recording (single key only)
    function makePageRecorder(inputId, btnId, setter) {
        var btn = document.getElementById(btnId);
        var input = document.getElementById(inputId);
        if (!btn || !input) return;
        btn.addEventListener('click', function() {
            if (isRecording) return;
            isRecording = true;
            input.value = '...';
            input.className = 'recording';
            btn.textContent = '...';
            function onKeyDown(e) {
                e.preventDefault();
                var key = e.keyCode;
                if (key === 16 || key === 17 || key === 18 || key === 91) return;
                isRecording = false;
                input.className = ''; btn.textContent = 'Record';
                document.removeEventListener('keydown', onKeyDown, true);
                setter(key);
                input.value = formatKeyName(key);
                saveSettings();
            }
            document.addEventListener('keydown', onKeyDown, true);
        });
    }
    makePageRecorder('prevPageInput', 'prevPageBtn', function(k) { prevPageKey = k; });
    makePageRecorder('nextPageInput', 'nextPageBtn', function(k) { nextPageKey = k; });

    document.getElementById('saveBtn').addEventListener('click', saveSettings);

    document.getElementById('langBtn').addEventListener('click', function() {
        language = 1 - language;
        setLanguage();
        triggerAutoSave();
    });

    // Collapse logic
    document.querySelectorAll('.collapsible-header').forEach(function(hdr) {
        hdr.addEventListener('click', function() {
            var id = this.dataset.target;
            var body = document.getElementById(id);
            if (!body) return;
            this.classList.toggle('collapsed');
            body.classList.toggle('collapsed');
        });
    });

    // Settings modal toggle
    var settingsBtn = document.getElementById('settingsBtn');
    var settingsModal = document.getElementById('settingsModal');
    var settingsClose = document.getElementById('settingsCloseBtn');
    if (settingsBtn && settingsModal) {
        function openSettings() {
            settingsModal.style.display = 'flex';
            updateTriggerDisplay();
            updatePageKeyDisplay();
            updateGlobals();
        }
        function closeSettings() { settingsModal.style.display = 'none'; }
        settingsBtn.addEventListener('click', openSettings);
        if (settingsClose) settingsClose.addEventListener('click', closeSettings);
        settingsModal.addEventListener('click', function(e) {
            if (e.target === this) closeSettings();
        });
    }

    // Effect search overlay
    var overlay = document.getElementById('effectSearchOverlay');
    if (overlay) overlay.addEventListener('click', function(e) {
        if (e.target === this) closeEffectSearch();
    });

    var searchInput = document.getElementById('effectSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            if (g_effectsCache) {
                updateEffectResults(this.value);
            } else {
                loadEffectsCache().then(function() {
                    updateEffectResults(searchInput.value);
                });
            }
        });
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeEffectSearch();
            if (e.key === 'Enter') {
                var list = document.getElementById('effectSearchResults');
                var first = list ? list.querySelector('.effect-item') : null;
                if (first) first.click();
            }
        });
    }

    // Preload effects cache when panel opens
    loadEffectsCache();

    // Copy debug log button
    document.getElementById('copyLogBtn').addEventListener('click', function() {
        var txt = g_logLines.join('\n');
        // Method 1: copy to clipboard via textarea
        var done = false;
        try {
            var ta = document.createElement('textarea');
            ta.value = txt;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            ta.style.top = '0';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            done = document.execCommand('copy');
            document.body.removeChild(ta);
        } catch(e) {}
        // Method 2: write to desktop file via ExtendScript
        if (!done) {
            try {
                var safe = txt.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
                evalScript('try{var f=new File("~/Desktop/wb_debug.log");f.open("w");f.write("' + safe + '");f.close()}catch(e){}');
                done = true;
            } catch(e) {}
        }
        // Method 3: download as file (CEF fallback)
        if (!done) {
            try {
                var blob = new Blob([txt], {type: 'text/plain'});
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'wb_debug_' + Date.now() + '.log';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                done = true;
            } catch(e2) {}
        }
        if (!done) {
            // Last resort: tell user to use DevTools
            dbg('OPEN DEVTOOLS: Right-click panel → Inspect → Console tab → type: copy(g_logLines.join("\\n"))');
        } else {
            // Brief visual flash
            var btn = document.getElementById('copyLogBtn');
            if (btn) {
                var orig = btn.textContent;
                btn.textContent = '✔ Copied';
                btn.style.color = '#5c5';
                setTimeout(function() { btn.textContent = orig; btn.style.color = ''; }, 1200);
            }
        }
    });

    // Scan Effects button: try AEGP dump first, fallback to ExtendScript
    document.getElementById('scanBtn').addEventListener('click', function() {
        var btn = this;
        btn.textContent = 'Scanning...';
        btn.disabled = true;
        dbg('scan: triggering AEGP effect dump...');
        evalScript('triggerDumpEffects()').then(function() {
            startEffectsMapPoll();
        });
    });

    // Auto-trigger AEGP dump on init to get real display names
    dbg('init: triggering AEGP effect dump...');
    evalScript('triggerDumpEffects()');
    startEffectsMapPoll();

    // ── Infinite Wheel event listeners ──
    window._infPreview = false;
    window._infHoverSlot = -1;
    window._infHoverSector = -1;
    window._infSectorColors = ['#3a6a3a','#6a5a3a','#3a5a7a','#6a3a5a','#5a5a3a','#3a6a5a','#5a3a6a','#6a4a3a'];
    var imsInit = document.getElementById('infMenuScale');
    if (imsInit) { imsInit.value = menuScale[curMenu]; document.getElementById('infMenuScaleV').textContent = menuScale[curMenu] + '%'; }

    var infSel = document.getElementById('infSectors');
    if (infSel) infSel.addEventListener('change', function() { renderInfinitePreview(); saveSettings(); });
    var infSplitR2El = document.getElementById('infSplitR2');
    if (infSplitR2El) infSplitR2El.addEventListener('change', function() { renderInfinitePreview(); saveSettings(); });
    var infSplitR3El = document.getElementById('infSplitR3');
    if (infSplitR3El) infSplitR3El.addEventListener('change', function() { renderInfinitePreview(); saveSettings(); });

    ['infRDz','infR1','infR2'].forEach(function(id) {
        var el = document.getElementById(id);
        var vEl = document.getElementById(id + 'V');
        if (el && vEl) el.addEventListener('input', function() { vEl.textContent = this.value; renderInfinitePreview(); saveSettings(); });
    });

    var sectorSel = document.getElementById('infSectorSelect');
    if (sectorSel) sectorSel.addEventListener('change', function() { renderSectorSlots(parseInt(this.value)); });

    var ims = document.getElementById('infMenuScale');
    if (ims) {
        ims.addEventListener('input', function() {
            document.getElementById('infMenuScaleV').textContent = this.value + '%';
        });
        ims.addEventListener('change', function() {
            document.getElementById('infMenuScaleV').textContent = this.value + '%';
            menuScale[curMenu] = parseInt(this.value) || 100;
            saveSettings();
        });
    }
document.getElementById('infModalClose').addEventListener('click', function() {
        document.getElementById('infEditModal').style.display = 'none';
    });
    document.getElementById('infEditModal').addEventListener('click', function(e) {
        if (e.target === this) this.style.display = 'none';
    });
    document.addEventListener('keydown', function(e) {
        if (infRecording) return;
        if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
            var m = document.getElementById('infEditModal');
            if (m && m.style.display === 'flex') { m.style.display = 'none'; e.preventDefault(); }
        }
    });
    document.getElementById('infModalSave').addEventListener('click', function() {
        if (infEditedSlot < 0) return;
        if (!window._infSlotData) window._infSlotData = [];
        var elName = document.getElementById('infEditName');
        var elIcon = document.getElementById('infEditIcon');
        // Validate title length: max 8 CJK chars or 16 ASCII chars
        if (elName.value) {
            var len = 0;
            for (var ci = 0; ci < elName.value.length; ci++) {
                len += elName.value.charCodeAt(ci) > 255 ? 2 : 1;
            }
            if (len > 16) {
                alert('标题过长。最多8个中文字符或16个英文字符。');
                return;
            }
        }
        // Validate icon
        if (elIcon.value && elIcon.value.indexOf('.') > 0) {
            var ext = elIcon.value.split('.').pop().toLowerCase();
            if (['png','jpg','jpeg','gif','bmp','svg'].indexOf(ext) < 0) {
                alert('图标路径必须以 png/jpg/gif/bmp/svg 结尾。');
                return;
            }
        }
        window._infSlotData[infEditedSlot] = {
            name: elName.value,
            effect: document.getElementById('infEditEffect').value,
            key: document.getElementById('infEditKey').value,
            icon: elIcon.value,
            font: parseInt(document.getElementById('infEditFont').value) || 100,
            iconSz: parseInt(document.getElementById('infEditIconSz').value) || 80,
            action: parseInt(document.getElementById('infEditAction').value) || 0
        };
        document.getElementById('infEditModal').style.display = 'none';
        renderInfinitePreview();
        saveSettings();
    });

    // Live value display for modal sliders
    ['infEditFont','infEditIconSz'].forEach(function(id) {
        var el = document.getElementById(id);
        var vEl = document.getElementById(id + 'V');
        if (el && vEl) el.addEventListener('input', function() { vEl.textContent = this.value + '%'; });
    });

    // Effect search for infinite modal
    document.getElementById('infEditEffect').addEventListener('focus', function() {
        if (infEditedSlot < 0) return;
        g_infEffectSearch = true;
        g_effectSearchTargetIdx = infEditedSlot;
        var input = document.getElementById('effectSearchInput');
        var overlay = document.getElementById('effectSearchOverlay');
        input.value = this.dataset.display || this.value || '';
        overlay.style.display = 'flex';
        setTimeout(function() { input.focus(); input.select(); }, 50);
        loadEffectsCache().then(function() { updateEffectResults(input.value); });
    });

    // Icon preview in edit modal
    document.getElementById('infEditIcon').addEventListener('input', function() {
        var prev = document.getElementById('infIconPrev');
        if (this.value) {
            prev.innerHTML = '<img src="' + this.value + '" style="max-width:32px;max-height:32px;">';
        } else {
            prev.textContent = '?';
        }
    });

    // Shortcut recording in edit modal
    document.getElementById('infKeyRec').addEventListener('click', function() {
        infRecording = true;
        this.textContent = '按按键...';
    });
    document.getElementById('infKeyClear').addEventListener('click', function() {
        document.getElementById('infEditKey').value = '';
        infRecording = false;
        document.getElementById('infKeyRec').textContent = '录制';
    });
    // Global keydown for modal recording
    document.addEventListener('keydown', function(e) {
        if (infRecording) {
            e.preventDefault();
            var k = e.key;
            if (k.length === 1) k = k.toUpperCase();
            else if (k === 'Space') k = 'Space';
            else if (k === 'Enter') k = 'Enter';
            else if (k === 'Escape') { infRecording = false; document.getElementById('infKeyRec').textContent = '录制'; return; }
            document.getElementById('infEditKey').value = k;
            infRecording = false;
            document.getElementById('infKeyRec').textContent = '录制';
        }
    });

    } catch(e) {
        var d = document.getElementById('status');
        if (d) d.innerHTML = '<span style="color:#f55;">JS ERR: ' + e.message + '</span>';
    }
});