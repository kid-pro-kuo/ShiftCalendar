const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withIosDeploymentTarget(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );

      if (!fs.existsSync(podfilePath)) {
        return config;
      }

      let content = fs.readFileSync(podfilePath, 'utf8');

      // Check if we already added the target bump logic
      if (content.includes("config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0'")) {
        return config;
      }

      const targetBumpScript = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        current_target = config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current_target && Gem::Version.new(current_target) < Gem::Version.new('16.0')
          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0'
        end
      end
    end

    installer.aggregate_targets.each do |target|
      target.user_project.targets.each do |user_target|
        user_target.build_configurations.each do |config|
          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0'
        end
      end
      target.user_project.save
    end`;

      // Find the react_native_post_install configuration block and inject our script
      const targetString = ':ccache_enabled => ccache_enabled?(podfile_properties),';
      if (content.includes(targetString)) {
        // We'll insert it right after the react_native_post_install closing parenthesis
        const targetBlockEnd = 'ccache_enabled => ccache_enabled?(podfile_properties),\n    )';
        content = content.replace(targetBlockEnd, `${targetBlockEnd}\n${targetBumpScript}`);
      } else {
        // Fallback: search for post_install block and insert at the top
        const fallbackTarget = 'post_install do |installer|';
        if (content.includes(fallbackTarget)) {
          content = content.replace(fallbackTarget, `${fallbackTarget}\n${targetBumpScript}`);
        }
      }

      fs.writeFileSync(podfilePath, content, 'utf8');
      return config;
    },
  ]);
};
