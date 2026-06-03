var COLORS = ['#dc5050','#50c864','#5050dc','#dcc83c','#b43cb4','#3cc8c8','#f08c28','#a0a0a0','#c8c8c8'];
var MAX = 9, PAGES = 3;
var labelMap = ['Pie','Quick','Wheel','Infinite'];

var curMenu = 0, curPage = 0;
var pieCount = 4, quickCount = 6;
var triggerKey = 32, triggerMod = 6, winAlpha = 60;
var prevPageKey = 90, nextPageKey = 88; // Z, X
var bgAlpha = [60,60,60,60], bgColor = ['2a2a2a','2a2a2a','2a2a2a','2a2a2a'], glowColor = ['3cb93c','3cb93c','3cb93c','3cb93c'], glowIntensity = [100,100,100,100];
var pageColor = ['78787d','78787d','78787d','78787d'];
var imgDist = [45,45,45,45], textDist = [85,85,85,85], textSize = [100,100,100,100], menuScale = [100,100,100,100];
var numpadEnabled = false;
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

var g_saveTimer = null;

var g_effectSearchTargetIdx = -1;

var g_effectsMapPollTimer = null;

var isRecording = false;

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