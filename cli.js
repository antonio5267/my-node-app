
const { program } = require('commander');
const inquirer = require('inquirer').default;
const chalk = require('chalk').default;       
const ora = require('ora').default;           
const cliProgress = require('cli-progress');

program
    .name('my-cli')
    .description('CLI-приложение для лабораторной работы №17')
    .version('1.0.0');

program
    .command('greet <name>')
    .description('поприветствовать пользователя')
    .action((name) => {
        console.log(chalk.green(`Привет, ${name}! Добро пожаловать в CLI-приложение группы ББМО-01-23.`));
    });

program
    .command('info')
    .description('вывести информацию о группе')
    .action(() => {
        console.log(chalk.blue('Группа: ББМО-01-23'));
        console.log(chalk.blue('Студент: Прищепа Антон Анатольевич'));
        console.log(chalk.blue('Лабораторная работа: №17'));
        console.log(chalk.blue(`Дата: ${new Date().toISOString().split('T')[0]}`));
    });

program
    .command('generate')
    .description('сгенерировать отчёт')
    .option('-t, --type <type>', 'тип отчёта (html, pdf, json, csv)', 'html')
    .option('-o, --output <path>', 'путь для сохранения')
    .option('-f, --force', 'перезаписать существующий файл')
    .option('--dry-run', 'показать что будет сделано без выполнения')
    .option('-v, --verbose', 'подробный вывод')
    .action((options) => {
        const allowedTypes = ['html', 'pdf', 'json', 'csv'];
        if (!allowedTypes.includes(options.type)) {
            console.error(chalk.red(`Ошибка: недопустимый тип отчёта "${options.type}".`));
            console.error(chalk.yellow(`Допустимые значения: ${allowedTypes.join(', ')}`));
            process.exit(1);
        }

        if (options.verbose) {
            console.log(chalk.blue('[VERBOSE] Запуск генерации отчёта...'));
            console.log(chalk.blue(`[VERBOSE] Тип отчёта: ${options.type}`));
            if (options.output) console.log(chalk.blue(`[VERBOSE] Путь сохранения: ${options.output}`));
        }

        if (options.dryRun) {
            console.log(chalk.yellow(`[DRY-RUN] Будет сгенерирован отчёт типа: ${options.type}`));
            console.log(chalk.yellow(`[DRY-RUN] Файл будет сохранён в: ${options.output || './output.' + options.type}`));
            console.log(chalk.yellow('[DRY-RUN] Действия не выполнены (режим проверки)'));
            return;
        }

        const spinner = ora('Генерация отчёта...').start();
        setTimeout(() => {
            spinner.succeed(chalk.green(`Отчёт успешно сгенерирован: ${options.output || './output.' + options.type}`));
        }, 1000);
    });

program
    .command('init')
    .description('инициализация проекта')
    .option('--name <name>', 'название проекта')
    .option('--type <type>', 'тип проекта')
    .option('--no-interactive', 'отключить интерактивный режим')
    .action(async (options) => {
        if (options.interactive === false) {
            if (!options.name || !options.type) {
                console.error(chalk.red('Ошибка: в неинтерактивном режиме необходимо указать --name и --type'));
                process.exit(1);
            }
            console.log(chalk.green(`Проект "${options.name}" успешно инициализирован!`));
            console.log(chalk.blue(`Тип: ${options.type}`));
            return;
        }

        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'projectName',
                message: 'Введите название проекта:',
                default: 'my-project'
            },
            {
                type: 'select',
                name: 'projectType',
                message: 'Выберите тип проекта:',
                choices: ['Web-приложение', 'CLI-утилита', 'Библиотека', 'Микросервис']
            },
            {
                type: 'checkbox',
                name: 'features',
                message: 'Выберите дополнительные опции:',
                choices: ['TypeScript', 'ESLint', 'Prettier', 'Jest']
            },
            {
                type: 'confirm',
                name: 'useGit',
                message: 'Использовать Git?',
                default: true
            }
        ]);

        console.log(chalk.green(`\nПроект "${answers.projectName}" успешно инициализирован!`));
        console.log(chalk.blue(`Тип: ${answers.projectType}`));
        console.log(chalk.blue(`Опции: ${answers.features.join(', ') || 'нет'}`));
        console.log(chalk.blue(`Git: ${answers.useGit ? 'да' : 'нет'}`));
    });
program
    .command('process')
    .description('обработка файлов с прогресс-баром')
    .option('--files <files...>', 'список файлов')
    .action((options) => {
        if (!options.files || options.files.length === 0) {
            console.error(chalk.red('Ошибка: укажите файлы через --files'));
            process.exit(1);
        }

        const files = options.files;
        const total = files.length;

        console.log(chalk.blue(`Начинаем обработку ${total} файлов...`));

        const bar = new cliProgress.SingleBar({
            format: 'Обработка |' + chalk.cyan('{bar}') + '| {percentage}% | {value}/{total}',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
        }, cliProgress.Presets.shades_classic);

        bar.start(total, 0);

        let current = 0;
        const interval = setInterval(() => {
            current++;
            bar.update(current);
            
            if (current === total) {
                clearInterval(interval);
                bar.stop();
                console.log(chalk.green('Обработка завершена!'));
            }
        }, 500);
    });

process.on('uncaughtException', (err) => {
    console.error(chalk.red(`Ошибка: ${err.message}`));
    process.exit(1);
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}