plugins {
    id("com.android.application")
}

android {
    namespace = "ru.vesninmed.nutrient"
    compileSdk = 35

    defaultConfig {
        applicationId = "ru.vesninmed.nutrient"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0-alpha"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    sourceSets.getByName("main").assets.srcDir("build/generated-web")
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

val prepareNutrientWeb by tasks.registering(Exec::class) {
    workingDir = rootProject.projectDir.parentFile
    commandLine("python3", "android/tools/package_web.py")
    inputs.dir(rootProject.projectDir.parentFile.resolve("site/tools/nutrition"))
    inputs.dir(rootProject.projectDir.parentFile.resolve("site/assets"))
    inputs.file(rootProject.projectDir.resolve("tools/package_web.py"))
    outputs.dir(layout.buildDirectory.dir("generated-web"))
}

tasks.named("preBuild").configure {
    dependsOn(prepareNutrientWeb)
}

dependencies {
    implementation("androidx.webkit:webkit:1.12.1")
    // The image-labeling model is bundled. No Play Services download is needed.
    implementation("com.google.mlkit:image-labeling:17.0.9")
}
