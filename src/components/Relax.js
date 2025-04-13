import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaUmbrellaBeach } from "react-icons/fa6";
import BrowserButton from './BrowserButton';
import Title from './Title';

const Relax = () => {
    const { t } = useTranslation();

    return (
        <div className="whiteBox rounded-4 p-3 my-3">
            <Title icon={<FaUmbrellaBeach size={24} />} text={t('relax')} />

            <div className='pt-2'>
                <BrowserButton
                    link="https://playpager.com/embed/sudoku/index.html"
                    buttonText="Sudoku"
                    variant="primary"
                    mode="button"
                />
                <BrowserButton
                    link="https://playpager.com/embed/domino-game/"
                    buttonText="Domino"
                    variant="success"
                    mode="button"
                />
                <BrowserButton
                    link="https://playpager.com/embed/battleship/"
                    buttonText="Battleship"
                    variant="secondary"
                    mode="button"
                />
                <BrowserButton
                    link="https://playpager.com/embed/mahjong/"
                    buttonText="Mahjong"
                    variant="light"
                    mode="button"
                />
                <BrowserButton
                    link="https://playpager.com/embed/falling-cubes/"
                    buttonText="Cubes"
                    variant="info"
                    mode="button"
                />
                <BrowserButton
                    link="https://playpager.com/embed/pool-billiards/"
                    buttonText="Billiard"
                    variant="success"
                    mode="button"
                />
                <BrowserButton
                    link="https://playpager.com/embed/baseball-titan/"
                    buttonText="Baseball"
                    variant="info"
                    mode="button"
                />
                <BrowserButton
                    link="https://playpager.com/embed/snake/"
                    buttonText="Snake"
                    variant="primary"
                    mode="button"
                />
                <BrowserButton
                    link="https://playpager.com/embed/brick-breakout/"
                    buttonText="Breakout"
                    variant="info"
                    mode="button"
                />
                <BrowserButton
                    link="https://playpager.com/embed/blackjack-game/"
                    buttonText="Blackjack"
                    variant="success"
                    mode="button"
                />
                <BrowserButton
                    link="https://www.youtube.com/embed/videoseries?list=PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG"
                    buttonText="Music"
                    variant="danger"
                    mode="button"
                />
                <BrowserButton
                    buttonText="YouTube link"
                    variant="success"
                    mode="input"
                />
            </div>
        </div>
    );
}

export default Relax;