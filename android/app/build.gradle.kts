plugins {
    id("com.android.application")
}

// Release credentials belong in a private keystore and the CI secret store.
// A missing key deliberately leaves the release build unsigned.
val nutrientKeystorePath = System.getenv("NUTRIENT_RELEASE_KEYSTORE")
val nutrientStorePassword = System.getenv("NUTRIENT_RELEASE_STORE_PASSWORD")
val nutrientKeyAlias = System.getenv("NUTRIENT_RELEASE_KEY_ALIAS")
val nutrientKeyPassword = System.getenv("NUTRIENT_RELEASE_KEY_PASSWORD")
val hasReleaseSigning = listOf(nutrientKeystorePath, nutrientStorePassword,
    nutrientKeyAlias, nutrientKeyPassword).all { !it.isNullOrBlank() }

android {
    namespace = "ru.vesninmed.nutrient"
    compileSdk = 35

    defaultConfig {
        applicationId = "ru.vesninmed.nutrient"
        minSdk = 26
        targetSdk = 35
        versionCode = 2
        versionName = "0.2.0-alpha"
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("nutrientRelease") {
                storeFile = file(nutrientKeystorePath!!)
                storePassword = nutrientStorePassword!!
                keyAlias = nutrientKeyAlias!!
                keyPassword = nutrientKeyPassword!!
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            if (hasReleaseSigning) {
                signingConfig = signingConfigs.getByName("nutrientRelease")
            }
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
    inputs.dir(rootProject.projectDir.resolve("catalog"))
    inputs.dir(rootProject.projectDir.resolve("data"))
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
